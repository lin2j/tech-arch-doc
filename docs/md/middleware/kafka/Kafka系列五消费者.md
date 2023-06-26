与生产者对应的是消费者，应用程序可以通过 KafkaConsumer 来订阅主题，从主题中拉取消息。

使用 KafkaConsumer 之前需要先理解消费者和消费者组的概念。

### 消费者与消费者组

消费者负责订阅主题并从主题中拉取消息。

消费者组由一个或者多个消费者组成。

一般来讲，一个消费者面向的是一个分区，而一个消费者组面向的是一个主题。

当主题中有多个分区，且一个消费者处理不过来时，可以通过往消费者组中增加消费者，来加快处理速度。

因此，消费者组的概念在横向伸缩和提高消费能力有着重要作用。

下图表示消费者组内不同数量的消费者与主题中分区的对应关系。

![消费者组与主题的关系](https://www.lin2j.tech/upload/2021/08/%E6%B6%88%E8%B4%B9%E8%80%85%E7%BB%84%E4%B8%8E%E4%B8%BB%E9%A2%98%E7%9A%84%E5%85%B3%E7%B3%BB-9b9fd6deb3784c7f8554a63a43428e06.png)

对于 consumer group A，当消费者组内的消费者数量多于分区数目时，会出现有消费者分配不到分区的情况，造成资源浪费。

对于 consumer group B，当消费者组内只有一个消费者时，那么该消费者需要消费所有分区的消息，负载可能会比较大。

当消费者处理不了那么多分区时，可以往消费者组内增加消费者的数量，来提高处理能力，像 consumer group C 那样。

以上的分配逻辑都是根据默认的分区分配策略决定的，客户端可以通过配置参数 `partition.assignment.strategy` 来设置消费者与订阅主题之间的分区分配策略。

### 客户端开发

消费者正常的消费逻辑一般有以下几个步骤

1. 配置消费者客户端参数并创建消费者实例；
2. 订阅主题；
3. 拉取消息并消费；
4. 提交偏移量；
5. 消费者实例销毁。

#### 客户端参数配置

与消费者对应的类时 KafkaConsumer<K, V>，它是个泛型。

实例化一个消费者需要以下四个参数。

1. `bootstrap.servers`：指定消费者客户端要链接的 Kafka 集群地址，多个地址通过英文逗号分隔，比如 host1:ip1,host2:ip2 。可以不用配置全部的地址清单，因为消费者会从给定的 broker 里获取其他 broker 的信息。不过还是建议配置多几个，保证其中一个 broker 宕机后，还能连上 Kafka 集群。
2. `group.id`：消费者所在的消费者组的名称，默认值为 ""。不能设置为空，会报异常，一般建议根据业务来命名消费者组。
3. `key.deserializer` 和 `value.deserializer`：与生产者客户端的 `key.serializer` 和 `value.serializer` 参数对应。需要执行与生产者相应的反序列化操作才可以将字节数组转为原有的对象格式。参数的值**一定要是序列化器的类的全限定名称**。

KafkaConsumer 的参数很多，因此官方提供了一个 ConsumerConfig 类，每个参数在这个类里面都有对应的常量，可以通过这个类来减少参数书写错误导致的问题。

#### 订阅主题和分区

消费者创建好之后，需要为消费者订阅主题。我们使用 KafkaConsumer 中的 subscribe() 方法订阅主题。

```java
public void subscribe(Collection<String> topics, ConsumerRebalanceListener listener);
public void subscribe(Collection<String> topics);
public void subscribe(Pattern pattern, ConsumerRebalanceListener listener);
public void subscribe(Pattern pattern);
```

KafkaConsumer 可以使用集合的方式来订阅主题。如果前后两次订阅的主题不同，那么以最后一次消费的主题为准。

```java
consumer.subscribe(Arrays.asList(topic1));
consumer.subscribe(Arrays.asList(topic2));
```

上面的示例中，consumer 最终会消费 topic2 的消息。

KafkaConsumer 也可以通过正则表达式来订阅主题，这样即使后面有新创建的主题，并且主题的名称与订阅的正则表达式匹配的话，这个消费者也可以消费新主题的信息。

```java
consumer.subscribe(Pattern.compile("topic-.*"));
```

除了使用 subscribe() 方法订阅主题以外，还可以使用 assign() 方法直接订阅某个主题的特定分区。

```java
public void assign(Collection<TopicPartition> partitions);

// TopicPartition 代表某个主题的某个分区
public final class TopicPartition implements Serializable {

    private int hash = 0;
    private final int partition;  // 分区
    private final String topic;   // 主题
    
    // ...省略构造函数、getter/setter
}
```

如果不知道主题内有多少个分区，那么可以通过 partitionsFor() 方法来查询指定主题的元数据信息。

```java
public List<PartitionInfo> partitionsFor(String topic);

// 主题的分区元数据信息
public class PartitionInfo {

    private final String topic;
    private final int partition;
    private final Node leader;
    private final Node[] replicas;
    private final Node[] inSyncReplicas;
    private final Node[] offlineReplicas;
    
    // 省略了构造函数，getter/setter
}
```

通过 partitionFor() 方法，我们就可以通过 assign() 方法来实现订阅主题的某个分区或者全部分区的功能了。

```java
List<PartitionInfo> paritionInfos = consumer.partitionsFor(topic);
List<TopicPartition> partitions = new ArrayList<>();
if(partitionInfos != null){
    for(PartitionInfo tpInfo : paritionInfos) {
        paritions.add(new TopicPartition(tpInfo.topic(), tpInfo.partition()));
       
    }
}
consumer.assign(partitions);
```

如果想要取消订阅，可以通过 unsubscribe() 方法取消主题的订阅。

不管是通过集合的方法订阅 subscribe(Collection) ，还是通过正则表达式订阅 subscribe(Pattern) ，还是通过指定分区的订阅 assign(Collection) ，都可以通过这种方式来取消订阅。

#### subscribe() 方法和 assign() 方法的区别

subscribe() 方法订阅主题具有消费者自动再均衡（Rebalance）的功能，在多个消费者的情况下可以根据分区分配策略自动分配各个消费者与分区的关系。

而通过 assign() 方法订阅分区时，是不具备自动再均衡的功能的。

从两个方法的签名上看，subscribe() 上出现了 ConsumerRebalanceListener 类型的参数，就是为了自动再均衡时准备的。

关于自动再均衡，下面还会讲到。

### 反序列化

对应着生产者的序列化阶段，消费也有一个反序列化阶段，需要执行与生产者相应的反序列化操作才可以将字节数组转为原有的对象格式。

Kafka 提供了一些内置的反序列化器：ByteBufferDeserializer、ByteArrayDeserializer、StringDeserializer 等等，这些序列化器都实现了 Deserializer 接口，它有三个方法。

```java
public interface Deserializer<T> extends Closeable {
	// 反序列化配置
    void configure(Map<String, ?> configs, boolean isKey);

	// 反序列化，将字节数组转化成 Java 对象
    T deserialize(String topic, byte[] data);

    // 关闭反序列化器
    void close();
}
```

事实上，如果没有特殊需要，不建议自定义序列化器和反序列化器，因为这样需要去保证序列化和反序列化的兼容性。

如果自带的反序列化器无法满足应用需求，则可以使用入 Avro、JSON、ProtoBuf  等等通用的工具来实现。

### 消息消费

KafkaConsumer 通过拉模式从主题获取消息的。

消息的消费一般有两种模式：推模式和拉模式。推模式就是服务端主动将消息推送给消费者。拉模式就是消费者主动从服务端拉取消息。

KafkaConsumer 通过 poll() 方法从服务端拉取消息。实际开发中要通过轮询的方式循环调用 poll() 方法，而 poll() 方法返回的是消费者订阅的主题或者分区上的一组消息。

```java
public ConsumerRecords<K, V> poll(long timeout);
```

参数 timeout 表示超时时间，单位是毫秒。如果接收数据的缓冲区没满，那么就等待指定时间后返回数据。如果为 0，那么会立即返回缓冲区的数据或者一个空的集合。该参数不能为负数。

poll() 方法返回的对象是一个 ConsumerRecords 类的实例，这个类实现了 Iterable 接口，所以可以直接使用 for-each 遍历 ConsumerRecords 对象，迭代器中的对象为 ConsumerRecord<K, V> 类型。

ConsumerRecord 是我们实际处理的对象，代表一条主题消息，包含了主题、分区、偏移量、主体数据等等信息。

```java
public class ConsumerRecord<K, V> {
    public static final long NO_TIMESTAMP = RecordBatch.NO_TIMESTAMP;
    public static final int NULL_SIZE = -1;
    public static final int NULL_CHECKSUM = -1;

    private final String topic;
    private final int partition;
    private final long offset;
    private final long timestamp;
    private final TimestampType timestampType;
    private final int serializedKeySize;
    private final int serializedValueSize;
    private final Headers headers;
    private final K key;
    private final V value;

    private volatile Long checksum;
}
```

前面提到一个消费者可以订阅多个主题，当订阅了多个主题时，因为不同主题的对象格式可能不同，需要分开处理。

ConsumerRecords 就提供了一个 records() 方法，通过传入的 TopicPartition 对象，可以返回拉取回来的对应主题分区的消息。records() 方法的实现如下：

```java
public List<ConsumerRecord<K, V>> records(TopicPartition partition) {
    // this.records 是一个 HashMap，key 为 TopicPartition 对象
    // 因此可以在 O(1) 的时间内找到主题分区的消息
    List<ConsumerRecord<K, V>> recs = this.records.get(partition);
        if (recs == null)
            return Collections.emptyList();
        else
            return Collections.unmodifiableList(recs);
    }
}
```

也可以通过主题名称获取消息集。

```java
public Iterable<ConsumerRecord<K, V>> records(String topic);
```

### 位移提交

#### 自动提交

默认的位移提交方式是自动提交，这个是由参数 `enable.auto.commit` 参数配置的，默认值为 true。

开启之后，每隔一段时间就会将每个分区拉取到的最大偏移量提交上去，这个时间间隔是由 `auto.commit.interval.ms` 参数配置的，默认是 5​ 秒。此参数生效的前提是 `enable.auto.commit` 参数为 true。

自动提交消费位移非常方便，可以降低开发的复杂度。但是也会带来重复消费和消息丢失的问题。

比如 5 秒内，拉回来了 100 条消息，处理了 20 条之后，消费者突然奔溃了。那么下次拉取消息的时候，因为上次的消费位移还没提交，所以还是拉回那 100 条消息，但是前面的 20 条之前已经消费过了。

即使可以通过缩短提交间隔，即修改 `auto.commit.interval.ms` 参数的大小，来减少重复消费的可能性，但是也不能完全避免。

#### 手动提交

除了自动提交之外，还可以选择手动提交。手动提交又可以细分为同步提交和异步提交。

同步提交对应的是 commitSync() 方法，它会根据 poll() 方法拉取的最新消费位移来进行提交。调用的时候，它会阻塞消费者线程直到位移提交完成。

```java
public void commitSync();
// 这个方法可以更加细粒度的、精准的控制位移提交
public void commitSync(final Map<TopicPartition, OffsetAndMetadata> offsets);
```

异步提交对应的是 commitAsync() 方法，它执行的时候，不会阻塞消费者线程，可以提高消费者的性能。

但是也可能在提交消费位移的结果还没返回之前就开始新的一轮拉取操作。

```java
public void commitAsync();
// 提供回调函数
public void commitAsync(OffsetCommitCallback callback);
// 这个方法可以更加细粒度的、精准的控制位移提交
public void commitAsync(final Map<TopicPartition, OffsetAndMetadata> offsets, OffsetCommitCallback callback);
```

### 消费者的一些控制方法

有些时候可能需要暂停消费，等到某些操作完成之后，再继续进行消费，那就可以使用以下两个方法拉进行控制。

KafkaConsumer 还提供了一个 paused() 方法来返回被暂停的分区集合。

```java
public void pause(Collection<TopicPartition> partitions);
public void resume(Collection<TopicPartition> partitions);
public Set<TopicPartition> paused();
```

当结束消费时，需要通过 close() 方法来释放运行过程中占用的各种系统资源。

```java
public void close();
public void close(long timeout, TimeUnit timeUnit);
```

#### 细粒度地控制消费

有时候，消费者可能找不到所记录的消费位移或者消费位移越界，此时就会从客户端参数 `auto.offset.reset` 的配置来决定从何处开始消费。

它的默认值有 `lastest`、`earliest`、`none`。

`lastest` 表示从最新的一条消息开始消费；

`earliest` 表示从分区最开始的消息开始消费；

`none` 表示既不从最新的，也不从最开始的消息消费，此时会报出 NoOffsetForPartitionException 异常。

但是有时候，这三个参数都无法满足我们的需要，我们需要从某一个位移开始消费。

为了能更加细粒度的消费，KafkaConsumer 提供了 seek() 方法来实现这个目的。

```java
public void seek(TopicPartition partition, long offset);
```

 这样在程序需要的时候，可以从数据库或者其他地方找到某个分区上一次消费的偏移量，通过这个方法，继续消费。前提是这个分区是已经分配给这个消费者了。

### 再均衡（Rebalance）

再均衡指的是消费者组内的消费者数量发生变化时，分区的所属权重新分配的过程。

因为有了自动再均衡，才能够安全地删除或者添加新的消费者，它为消费者组具备高可用性和伸缩性提供了保障。

再均衡期间，消费者组内的消费者都不能进行信息消费，重新分配到分区的消费者也不知道这个分区之前的消费进度。

再均衡发生之后，可能出现重复消费的情况，因此要尽量避免再均衡的发生。

前面还提到过再均衡监听器 ConsumerRebalanceListener，它是用在再均衡发生前后进行一些准备和首位的动作的。

```java
public interface ConsumerRebalanceListener {

    void onPartitionsRevoked(Collection<TopicPartition> partitions);

    void onPartitionsAssigned(Collection<TopicPartition> partitions);
}
```

onPartitionRevoked() 方法发生在消费者停止读取消息和再均衡开始之前。可以在这个阶段将分区的消费状态保存起来，等到再均衡之后再恢复，避免重复消费的情况发生。

onPartitionAssigned() 方法发生在再均衡之后和消费者开始拉取消息之前。可以在这个阶段将分区的消费状态进行恢复。

再均衡监听器可以通过外部存储的配合，在 onPartitionRevoked() 中将消费位移保存起来，然后在 onPartitionAssigned() 方法中找到对应分区的消费位移，并配合 seek() 方法从上一次消费的地方进行消费。

### 消费者拦截器

与生产者拦截器对应，消费者拦截器需要实现 ConsumerInterceptor 接口，它包含了三个方法。

```java
public interface ConsumerInterceptor<K, V> extends Configurable {
	
    public ConsumerRecords<K, V> onConsume(ConsumerRecords<K, V> records);

    public void onCommit(Map<TopicPartition, OffsetAndMetadata> offsets);

    public void close();
}
```

onConsume() 方法可以在 poll() 方法返回之前，对消息进行定制会操作，比如按照某个规则过滤。这个方法的抛出的异常只会被记录在日志中，不会向上传递。

onCommit() 方法会在提交完消费位移之后调用，可以使用这个方法记录已提交的消费位移。

### 重要的参数

**fetch.min.bytes**

该参数用来配置 Consumer 在调用 poll() 方法时从 Kafka 拉取的最小数据量，默认是 1 B。

适当调大这个参数可以提高一定的吞吐量，也会增加额外的延迟。

**fetch.max.bytes**

该参数用来配置 Consumer 在调用 poll() 方法是从 Kafka 拉取的最大数据量，默认是 50 MB。

**fetch.max.wait.ms**

该参数与 `fetch.min.bytes` 参数配合着使用，当数据迟迟没有达到 `fetch.min.bytes` 参数的要求时，就会等待到该参数指定的时间后返回数据，默认是 500 ms。

**max.partition.fetch.bytes**

该参数用来配置从每个分区里返回给 Consumer 的最大数据量，默认是 1MB。

**max.poll.records**

该参数用来配置一次拉取请求中拉取的最大消息数，默认是 500 条。

**connections.max.idle.ms**

该参数用来指定再多久后关闭空闲的连接，默认是 9 分钟。

**request.timeout.ms**

该参数用来配置 Consumer 等待请求响应的最长时间，默认值是 30 秒。

