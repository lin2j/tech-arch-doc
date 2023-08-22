---
title: 集群管理
---



# 集群

Kafka 在搭建集群的时候需要借助 Zookeeper 来进行集群成员（Brokers）的管理。每一个 Broker 都有一个唯一标识 `broker.id`，用于自己在集群中的身份标识。可以在配置文件 `server.properties` 进行配置，或者由 Kafka 自己生成。

当有多个 Broker 时，需要选举出一个 Broker 作为整个集群的 Controller。Controller是 Kafka 的核心组件，它的主要作用是在 Zookeeper 的帮助下管理和协调控制整个Kafka集群。集群中的任意一台 Broker 都能充当 Controller 的角色，但是，在整个集群运行过程中，只能有一个Broker成为Controller。也就是说，每个正常运行的Kafka集群，在任何时刻都有且只有一个Controller。

Controller职责大致分为 5 种：主题管理，分区重分配，Preferred leader选举，集群成员管理（Broker上下线），数据服务（向其他Broker提供数据服务）。

## Broker 的注册

在每一个 Kafka Broker 启动的时候，会向 Zookeeper 的 `/brokers/ids` 路径下创建一个临时节点，并将自己的 Broker ID 写入，从而注册到 Zookeeper 中。

在选举 Controller 时，所有的 Broker 会在 Zookeeper 上创建一个 `/controller` 节点，由于 Zookeeper 上的节点不会重复，因此只会有一个 Broker 能成为 Controller。

当 broker 出现宕机或者主动退出从而导致其持有的 Zookeeper 会话超时时，会触发注册在 Zookeeper 上的 watcher 事件，此时 Kafka 会进行相应的容错处理；如果宕机的是 controller broker 时，还会触发新的 controller 选举。

# 副本机制

为了保证集群的高可用性，Kafka 的分区可以设置为多副本的，这样在某个副本丢失的情况下，可以从其他的副本中获取信息。副本是对于 Partition 而言的，一个 Topic 有多个 Partition，每个 Partition 又有自己的副本，分为 Partition Leader 和 Partition Follower。

Partition Follower 定期从 Partition Leader 同步数据，主从之间会有同步延迟，因此每个分区都会有一个 ISR （in-sync Replica）列表，用于维护认为是同步的、可用的副本列表。对于 ISR 而言，Partition Leader 必定在其中，而 Partition Follower 则需要满足以下条件才能被认为是同步副本：

1. 与 Zookeeper 之间有一个活跃的会话，即必须定时向 Zookeeper 发送心跳；
2. 在规定时间内从 Partition Leader 那里低延迟地获取过消息。

假设有三个 Topic，分别是 A、B、C，每个 Topic 都有 $3$ 个分区，每个分区又有 $3$ 副本，则各个分区副本在集群的分布示意图如下：

![kafka-replication](https://www.lin2j.tech/blog-image/middleware/kafka-replication.png)

## 副本消息的同步

当 Producer 发布消息到某个 Partition 时，无论 Partition 有多少副本，与之对接的一定是 Partition Leader。Partition Leader 会向消息写入内存，之后等待刷盘线程写入磁盘。之后每个 Partition Follower 会从 Partition Leader 获取数据进行同步。

Partition Follower 收到消息并写入 Log 后，会向 Partition Leader 发送 Ack 信号。一旦所有的 Partition Follower 都返回 Ack 信号，则表示该条信息在集群中已经 commit，则 Partition Leader 也会向 Producer 发送 Ack 信号。

为了提高性能，每个 Follower 在接收到数据后就立马向 Leader 发送 ACK，而非等到数据写入 Log 中。因此对于已经 commit 的消息，Kafka 只能保证它被存在于多个副本的内存中，而不能保证它们被持久化到磁盘中，也就不能完全保证异常发生后该条消息一定能被 Consumer 消费。

在 Kafka 的副本同步机制中，Producer 可以通过配置 `request.required.acks` 来指定不同的数据一致性等级。

- request.required.acks = 0：Producer 不需要等待来自 Partition Leader 的 Ack 信号，直接发送下一条消息。这种情况不能保证信息会被 Partition Leader 存储，存在数据丢失的风险。
- request.required.acks = 1：Producer 等待来自 Partition Leader 的 Ack 信号之后，才能发送下一条信息。这种情况可以保证信息被 Partition Leader 存储，但是不能保证所有的 Partition Follower 已经完成同步。如果 Partition Leader 宕机而消息又还没同步到 Partition Follower，则该条信息会丢失。
- request.required.acks = -1：表示 Producer 等待来自 Partition Leader 和所有 Partition Follower 的 ACK 确认之后，才发送下一条消息。在这种情况下，无论什么情况都不会发生消息的丢失，除非所有 Partition Follower 节点都宕机了。

上面三种不同值的设置，性能依次递减，但数据健壮性则依次递增。

## 副本 Leader 的选举

实际上，leader 选举的算法非常多，比如 Zookeeper 的 Zab、Raft 以及 Viewstamped Replication。而Kafka所使用的 leader 选举算法更像是微软的 PacificA 算法。

Kafka 在 Zookeeper 中为每一个 partition 动态的维护了一个 ISR，这个 ISR 里的所有 replica 都跟上了 leader，只有 ISR 里的成员才能有被选为leader的可能（unclean.leader.election.enable=false）。在这种模式下，对于 f+1 个副本，一个 Kafka topic 能在保证不丢失已经 commit 消息的前提下容忍 f 个副本的失败，在大多数使用场景下，这种模式是十分有利的。事实上，为了容忍 f 个副本的失败，“少数服从多数”的方式和 ISR 在 commit 前需要等待的副本的数量是一样的，但是 ISR 需要的总的副本的个数几乎是“少数服从多数”的方式的一半。

上文提到，在 ISR 中至少有一个 follower 时，Kafka 可以确保已经 commit 的数据不丢失，但如果某一个partition的所有replica都挂了，就无法保证数据不丢失了。这种情况下有两种可行的方案：

- 等待ISR中任意一个replica“活”过来，并且选它作为leader
- 选择第一个“活”过来的replica（并不一定是在ISR中）作为leader

如果一定要等待ISR中的replica“活”过来，那不可用的时间就可能会相对较长。而且如果ISR中所有的replica都无法“活”过来了，或者数据丢失了，这个partition将永远不可用。选择第一个“活”过来的replica作为leader,而这个replica不是ISR中的replica,那即使它并不保障已经包含了所有已commit的消息，它也会成为leader而作为consumer的数据源。默认情况下，Kafka采用第二种策略，即`unclean.leader.election.enable=true`，也可以将此参数设置为false来启用第一种策略。

# 参考文章

- https://juejin.cn/post/6844903950009794567
- https://shuyi.tech/archives/kafka-series-05-replica-copy-mechanism
- https://cloud.tencent.com/developer/news/863931
- https://www.cnblogs.com/aidodoo/p/8888628.html
