Kafka 是一款分布式消息发布和订阅系统，其高性能、高吞吐量的特点决定了其适用于大数据传输场景。

### 基础概念

#### Broker

Broker 其实就是一个运行 Kafka 服务的服务器。Kafka 集群包含一个或者多个的服务器，这些服务器就称为 Broker。Broker 不维护数据的消费状态，直接使用磁盘进行存储（通过配置的大小和时间批量写入），线性读写，速度快。

#### Topic

Kafka 中的 Topic 是一类数据的分类，比如告警消息 AlarmMessage 这个 Topic，Kafka 使用 Topic 区分各种数据类型。一个 Topic 下可以有多个 Partition。

#### Partition

一般来说，一个 Topic 下会有多个 Partition，也叫分区，每个分区可以看作是一个队列。每一个分区都是一个顺序的、不可变的、持续添加（append）的消息队列。

一个 Topic 下的多个分区的数据类型是相同的，采用分区的目的是：

- 可以处理更多的消息，topic 拥有更多的分区意味着可以存储更多的-
- 方便并行处理消息，分区可以作为并行处理的单元

#### Producer

生产者，负责往消息队列发送数据。

#### Consumer

消费者，负责消费消息队列的数据。

#### Zookeeper

因为 Kafka 是一个分布式的消息系统，所以 zookeeper 是用于Kafka集群的管理。其作用体现在系统中的 Broker 注册、Topic 注册、生产者注册、消费者注册、负载均衡等等方面之中。

![Kafka中Zookeeper的作用](https://www.lin2j.tech/upload/2021/05/Kafka%E4%B8%ADZookeeper%E7%9A%84%E4%BD%9C%E7%94%A8-30f8403146ba4a1aacd4d11ad8bb847e.jpg)