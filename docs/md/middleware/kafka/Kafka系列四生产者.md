一条消息从生产到发送成功，需要经过多个步骤，多个组件。首先要经过拦截器、序列化器、分区器对消息进行预处理，然后将消息按批次放入缓冲区，之后由 Sender 线程将消息发送到对应的节点以及分区。以下是大概流程

![生产者流程图](https://www.lin2j.tech/upload/2021/07/%E7%94%9F%E4%BA%A7%E8%80%85%E6%B5%81%E7%A8%8B%E5%9B%BE-8be30f4e17504b24ace33b8ab0757399.png)



# 生产者的配置

生产者对应的类是 KafkaProducer<K,V>，它是个泛型，其中 K 和 V 分别对应 `key.serializer` 和 `value.serializer` 参数的类型。

实例化一个生产者需要有以下三个**必填参数**。

1. `bootstrap.servers`：指定生产者客户端要链接的 Kafka 集群地址，多个地址通过英文逗号分隔，比如 host1:ip1,host2:ip2 。可以不用配置全部的地址清单，因为生产者会从给定的 broker 里获取其他 broker 的信息。不过还是建议配置多几个，保证其中一个 broker 宕机后，还能连上 Kafka 集群。

2. `key.serializer` 和 `value.serializer`：因为 broker 端接收到的消息必须以字节数组的形式存在，因此在将消息发送到 broker 之前，需要对消息的 key 和 value 进行序列化操作转换成字节数组。参数的值**一定要是序列化器的类的全限定名称**。以 StringSerializer 为例，一般在代码中用这种方式去获取全限定名称，以保证不会出错。

   ```java
   props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,StringSeriablizer.class.getName());
   ```

当然还有其他的参数可以根据实际需要去合理配置，比如 `batch.size` 、`acks`、`linger.ms`、`max.request.size` 等等。

# 发送

## 消息的构建

Kafka 中的消息对应的类是 ProducerRecord<K,V> 它是个泛型，其中 K 和 V 分别对应 `key.serializer` 和 `value.serializer` 参数的类型。一条消息要发送的时候，需要先构建消息，即创建 ProducerRecord 对象，此时 topic 和 value 属性是必填项。

```java
public ProducerRecord(String topic, V value);
```

当需要直接指定分区或者 key 的时候，还可以使用以下的构造方法。

```java
public ProducerRecord(String topic, Integer partition, Long timestamp, K key, V value, Iterable<Header> headers)
```

## 消息的发送方式

发送消息时，可以调用 KafkaProducer 的 send 方法。这个方法有两个重载方法。

```java
public Future<RecordMetadata> send(ProducerRecord<K, V> record);
public Future<RecordMetadata> send(ProducerRecord<K, V> record, Callback callback);
```

可以看到调用之后，会返回一个 Future 对象，甚至还可以传入一个 Callback 用来作为消息发送之后的回调操作。

根据对以上两个方法的不同调用，可以实现三种发送方式：**发后即忘（fire-and-forget）、同步（sync）及异步（async）**。

- **fire-and-forget**：指发送过后，不管成功与否，都不会做任何后续操作。这意味着如果消息发送失败了，那么也就丢失了，**可靠性变差，但是性能最高**。

- **sync**：指消息发送之后，线程阻塞等待发送结果。需要使用到返回的 Future 对象。比如：

  ```java
  try{
      Future<RecordMetadata> future = producer.send(data);
      // 调用 get 方法会阻塞当前线程直到方法有返回
      RecordMetadata result = future.get();
      // 对 result 进行操作
  } catch (ExecutionException | InterruptedException e) {
      // 异常处理
  }
  ```

  同步发送的**可靠性高**，只有两个结果：要么成功，要么异常。发生异常的时候，还可以根据情况去做处理。

- **async**：异步发送需要用到 Callback 对象，在 Kafka 有响应的时候进行回调，要么成功，要么抛出异常。比如：

  ```java
  producer.send(data, new Callback() {
     @Overrid
     public void onCompletion(RecordMetadata metadata, Exception exception){
         if(exception == null) {
             // 发送成功，可以打印 metadata 的信息等
         } else {
             // 发送失败，处理异常
         }
     } 
  });
  ```

  对于 onCompletion 的两个参数 metadata 和 exception ，他们是互斥的：消息发送成功，metadata 不为 null，exception 为 null；消息发送异常，metadata 为 null，exception 不为 null。

  - 如果**使用 Futrue 对象来做回调**，是否可以？

    理论上是可以的，但是当发送的消息很多时，就需要处理很多的 Future 对象。而且什么时候调用 get 方法，也是一个问题，会使问题处理起来变得麻烦，代码变得混乱。

## 异常的类型

在发送消息的过程，可能发生异常，这里的异常主要分为两种：可重试异常和不可重试异常。

常见的可重试异常有：NetworkException、LeaderNotAvailableException、NotEnoughRelicasException、UnknownTopicOrPartitionException 等。

发生可重试异常时，如果配置了 `retries` 参数（默认为0），那么就会在规定的次数里进行重试。

```java
props.put(ProducerConf.RETRIES_CONFIG, 10);
```

不可重试异常比如 RecordTooLargeException ，说明发送的消息太大，这种是通过重试解决不了的，Kafka 会直接抛出异常。

# 序列化

前面提到，broker 接收到的消息必须以字节数组的形式存在，因此发送前需要对消息进行序列化。

Kafka 中的序列化器都实现了 org.apache.kafka.common.serialization.Serializer 接口，它有 3 个方法。

```java
// 为序列化器做一些配置工作
void configure(Map<String, ?> configs, boolean isKey);

// 将消息转化为字节数组
byte[] serialize(String topic, T data);

// 关闭序列化器，这个方法时继承自 java.io.Closable 接口
// 一般情况下，该方法是个空方法，如果要实现，需要保证该方法的幂等性
void close();
```

与序列化器对应的是反序列化器，反序列化器用于在消费者将从 Kafka 获得的字节数组转换为响应的对象。

对于 String 类型的 key 和 value ，可以用 Kafka 自带的 StringSerializer 序列化器。除此之外，还有针对 ByteArray、ByteBuffer、Bytes、Double、Integer、Long 这几种类型的序列化器。

可以看一下 StringSerializer 类的实现，代码比较简单，可以对 Serializer 接口有更进一步的认识。

如果自带的序列化器无法满足应用需求，则可以使用入 Avro、JSON、ProtoBuf  等等通用的序列化工具来实现。

# 分区器

消息经过序列化之后，就要确定要发往的分区了。如果消息的 ProducerRecord 有指定 partition 字段，那么就不需要分区器的作用，因为 partition 代表所要发往的分区号。

如果没有指定 partition 字段，就需要用分区器计算 partition 字段。Kafka 中提供了一个默认的分区器 DefaultPartitioner，它实现了 Partitioner 接口，它定义了以下两个方法

```java
// 根据消息计算分区
public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster);

// 关闭分区器
public void close();
```

除此之外，它还继承了 Configurable 接口，因此还有一个方法用来配置分区器的信息和初始化数据。

```java
void configure(Map<String, ?> configs);
```

## DefaultPartitioner

DefaultPartitioner 在计算 partition 字段上时，会判断传入的 key 是否为 null。 DefaultPartitioner 的实现很简短，可以直接看代码。

```java
public class DefaultPartitioner implements Partitioner {

    private final ConcurrentMap<String, AtomicInteger> topicCounterMap = new ConcurrentHashMap<>();

    public void configure(Map<String, ?> configs) {}
    
    /**
     * @param topic 		topic的名称
     * @param key 			消息的key，可以为null
     * @param keyBytes 		消息的key对应的字节数组，可以为null
     * @param value 		消息的value，可以为null
     * @param valueBytes 	消息的value对应的字节数组，可以为null
     * @param cluster 		集群的信息
     */
    public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
        // 从集群中获取分区数目，用于对哈希值进行取模
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();
        if (keyBytes == null) {
            // 当 key 为null时，会在所有可用的分区中，选择一个分区
            int nextValue = nextValue(topic);
            // 获取所有可用分区
            List<PartitionInfo> availablePartitions = cluster.availablePartitionsForTopic(topic);
            if (availablePartitions.size() > 0) {
                int part = Utils.toPositive(nextValue) % availablePartitions.size();
                // 在可用分区中选择
                return availablePartitions.get(part).partition();
            } else {
                // 如果可用分区数为 0，那就在所有的分区中进行选择
                return Utils.toPositive(nextValue) % numPartitions;
            }
        } else {
            // 如果 key 不为 null，使用 MurmurHash2 算法进行哈希。
            return Utils.toPositive(Utils.murmur2(keyBytes)) % numPartitions;
        }
    }

    /**
     * 可以理解为获取一个对应 topic 的随机数
     */
    private int nextValue(String topic) {
        AtomicInteger counter = topicCounterMap.get(topic);
        if (null == counter) {
            counter = new AtomicInteger(ThreadLocalRandom.current().nextInt());
            AtomicInteger currentCounter = topicCounterMap.putIfAbsent(topic, counter);
            if (currentCounter != null) {
                counter = currentCounter;
            }
        }
        return counter.getAndIncrement();
    }

    public void close() {}
}
```

## 自定义分区器

如果要按照自身的需要去设计分区逻辑，可以自定义一个分区器，只需要实现  Partitioner 接口，然后在启动的时候，指定对应的分区器即可。

```java
props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, "自定义分区器的全限定名");
```

# 生产者拦截器

生产者拦截器可以实现在消息发送前与应答后做一些定制化的需求，比如过滤某些消息。

### ProducerInterceptor 接口

生成者拦截器需要实现 ProducerInterceptor 接口，它继承了 Configurable 接口，并且定义了一下三个方法

```java
public ProducerRecord<K, V> onSend(ProducerRecord<K, V> record);

public void onAcknowledgement(RecordMetadata metadata, Exception exception);

public void close();
```

**onSend** 方法在序列化和分区分配之前调用。如果在这一步修改了 key 或者 topic 的信息，会影响到下一步分区操作，因为分区时用的 key 和 topic 是来自拦截器的，而不是最开始的 key 和 topic。因此**一般不要修改 ProducerRecord 的 key 、value、topic 等信息**，否则可能会产生与预期不同的结果或者异常，同样会影响 broker 端的日志压缩。

**onAcknowledgement** 方法在消息已被 broker 端确认之后，或者发送到 broker 之前失败时调用，并且是先于 send 方法中指定的 Callback 调用的。这个方法一般运行在 $I/O$ 线程中，因此越简单越好，否则会影响消息的发送速度。

**close** 方法主要是关闭拦截器，做资源清理工作。

### 拦截器的调用顺序

拦截器的配置方式如下

```java
props.put(ProducerConfig.INTERCEPTOR_CLASSES_CONFIG, "拦截器1的全限定名,拦截器2的全限定名");
```

如果有多个拦截器，可以通过英文逗号将这些拦截器的全限定名连接起来，并且拦截器之间的执行顺序是按照配置的时候的顺序调用的，比如这里拦截器1会早于拦截器2被执行。

**尽量不要让后面的拦截器去依赖前面拦截器的执行结果**。

# 消息累加器

消息累加器（RecordAccumulator）也叫消息收集器。

消息客户端是由两个线程协调运行的

- 主线程完成消息从生产到拦截器、序列化器、分区器的过程；
- Sender 线程负责从消息累加器中获取消息并将其发送到 Kafka 中。

消息从主线程中生产后，会先缓存到消息累加器中，等待 Sender 线程批量发送。

消息累加器内部为每个分区都维护了一个双端队列 Deque 用来存储 ProducerBatch，ProducerBatch 中包含一个或者多个 ProducerRecord。使用 ProducerBatch 可以批量发送消息，减少网络请求次数，提高吞吐量。

消息累加器的大小通过参数 `buffer-memory` 决定，默认是 32M。

### CopyOnWriteMap

上文提到消息累加器内部为每个分区维护了一个双端队列，这个对应关系是通过 CopyOnWriteMap 这个数据结构实现的。

CopyOnWriteMap 是 Kafka 实现的一个线程安全的 Map 类型的数据结构。

在 RecordAccumulator 中，声明一个该类型的成员变量 batches，这个对象的 key 是消息主题的分区，value 是一个双端队列。

之所以需要自定义一个数据结构，是因为

- 为了维持分区到队列的关系，这个结构最好是 key-value 类型的，所以锁定 Map 类型的结构。

- Kafka 的生产者会在大量生产消息时，会有大量的数据涌入消息累加器，所以这个数据结构需要是线程安全的。
- 大量涌入数据的同时，对应的是对 batches 对象的大量读，而分区的数量一般不会有什么变化，因此面对的是一个读多写少的情况。Kafka 通过模仿 CopyOnWriteList 实现了 CopyOnWriteMap 数据结构，采用读写分离来解决读多写少的问题又保证了线程安全。

### ProducerBatch

上文提到双端队列中存储的对象类型是 ProducerBatch ，而这个对象的大小是由 `batch.size` 参数决定的，默认是 16k ，整个缓存的大小是 32M。

在频繁的发送消息的过程中，势必会不断创建 ProducerBatch 对象，如果每次都通过 GC 来回收内存，这样会发生频繁的 GC，影响性能。

因此 Kafka 在缓存中设计了一个内存池，16k 的内存如果用完了，就返回给内存池，需要的时候再向内存池申请。这是一种提高性能的不错实践。

# Sender线程

把消息放进缓冲区之后，与此同时会有一个独立线程Sender去把一个个Batch发送给对应的主机。

# 整体架构图

![生产者整体架构图](https://www.lin2j.tech/upload/2021/08/%E7%94%9F%E4%BA%A7%E8%80%85%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84%E5%9B%BE-b8d36269a27e4f0ba72cd1ab21fa0c98.png)

# 重要的参数

### acks 消息验证

消息发送到服务器之后，有三种方式认为是否发送成功

- 1：只要 leader 副本写入成功，就会收到来自服务器的成功响应；
- 0：发送消息后不需要等待服务器响应就算发送成功；
- -1：需要 ISR 中所有的副本写入成功才能收到来自服务器的成功响应；
- all：同 -1 。

### retries 重试次数

有时候发生网络错误可能发送不成功，但是下一秒就好了，因此可以设置重试机制。

### batch.size 批次大小

ProducerBatch 的大小，默认是 16k，设置大一点可以提高吞吐量。

### linger.size 发送时间限制

消息发送的条件有两个，一个是数据量达到 batch.size 指定的大小，一个是达到了 `linger.size` 指定的时间。达到时间限制后，就算数据量很小也会被发送。

### buffer.memory 缓冲区大小

当发送速率比不上生产速率时，需要一个缓冲区来减小发送的压力。默认是 32M。

### max.request.size 最大消息大小

用来控制发送的消息的最大大小，默认是 1M。当超过限制大小时就会抛出 RecordTooLargeException 异常。

### request.timeout.ms 请求超时

消息发送之后的超时等待时间，默认时 30 秒。超过等待时间会抛出 TimeoutException 。