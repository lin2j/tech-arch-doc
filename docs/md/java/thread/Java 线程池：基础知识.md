

##### 线程池的概念和工作机制
- 概念：首先**系统空闲时**在创建大量线程，这些线程的集合成为线程池。线程的**生老病死都由线程池来决定**。
- 工作机制：当有任务到来时，**提交给线程池**，由线程池来指定线程执行任务。线程池会在**内部寻找**是否有可以执行任务的线程。任务执行完成后，线程**不会被销毁**，而是进入空闲状态。一个**线程**一个时刻只能执行一个任务，但是却可以向**线程池**提交多个任务（只不过后来的任务**可能需要等待**）。
---

##### 为什么要使用线程池(好处)？
- **降低资源的消耗**：线程在创建和销毁时都是很耗费资源和时间的，我们希望通过一种机制，可以避免频繁地创建和销毁线程。

- **提高响应速度**：因为线程池中的线程大部分是事先系统在空闲时创建的，所以当有任务到来的时候，可以直接使用已有线程，而不用去创建。**任务一来就可以直接执行**。

- **控制线程的并发数量**：当线程的数目非常多时，我们就需要考虑高并发带来的一系列问题。多个线程可能因为争夺资源而使系统崩溃，运用多线程可以有效的控制线程的数目。

- **提高线程的可管理性**：可以对某些线程设定延时执行（DelayQueue)、或者循环执行等策略。

  > 线程复用；控制最大并发数；管理线程

---

##### 线程池ThreadPoolExecutor
```java
// 先看一条创建线程池的语句
ExecutorService service = Executors.newFixedThreadPool(5);
```
在这里需要提到几个接口和类：Executor, ExecutorService, Executors, ThreadPoolExecutor
关于这几个接口和类，这里有篇文章讲得更详细:[传送门](https://josh-persistence.iteye.com/blog/2145120)

- **Executor**：理解为执行器，内部只要一个执行方法 execute(Runnable command)。是线程池的一个核心接口。
- **ExecutorService**：继承了Executor，并**做了拓展**，增加了一堆供程序员开发用的api，所以你用起ExectorService才会那么舒服，其次，它还**增加**了对线程池**生命周期的概念**，一个线程池的声明周期有三种状态：**运行、关闭和终止**。
- **Executors**：是一个用来创建线程池的**工具类**（像Collections类的存在），其返回的线程池都是实现了ExecutorService接口。
- **ThreadPoolExecutor**：该类继承AbstractExecutorService抽象类，实现了ExecutorService接口，**内部维护着一个线程池**。一般我们只需要通过这个类的构造函数来配置线程池就好了。
ThreadPoolExecutor这是学习多线程的开头，通过学习该类的参数，来慢慢理解线程池内部的结构。

###### 通过ThreadPoolExecutor的构造函数看参数
```java
// 1.
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUtil util,
                          BlockingQueue<Runnable> workQueue)
// 2.
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUtil unit，
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory)
// 3.
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUtil util,
                          BlockingQueue<Runnable> workQueue,
                          RejectedExecutionHandler handler)
// 4.
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUtil util,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler)

```
> 参数虽然多，但是确实必须理解的，而且其中有两种是不用去理会的
> 这里有简单版的
> `corePoolSize` 为线程池的基本大小。
> `maximumPoolSize` 为线程池最大线程大小。
> `keepAliveTime` 和 `unit` 则是线程空闲后的存活时间。
> `workQueue` 用于存放任务的阻塞队列。
> `handler` 当队列和最大线程池都满了之后的饱和策略。
- `corePoolSize`：核心线程的最大数目。
  
    - 核心线程：当线程池在新建线程时，如果当前池内的线程数小于 corePoolSize，那么创建出来的就是核心线程。
    - 核心线程**默认**情况下会**一直存在于线程池**中，即使这个线程一直不做事。不过我们可以通过ThreadPoolExecutor的**allowCoreThreadTimeOut**属性，设置其为true，那么线程池就会去回收长时间不做事的线程了。
- `maximumPoolSize`
  
    - 线程池中的最大线程数目 = 核心线程数 + 非核心线程数。
- `keepAliveTime`
  
    - 该线程池中，**非核心线程**的闲置时间，**超时销毁**。
- `TimeUtil util`
  
    - `keepAliveTime` 的单位，`TimeUtil` 是一个枚举类型，包括了
    1. `NANOSECONDS`：微毫秒
    2. `MICROSECONDS`：微秒
    3. `MILLISECONDS`：毫秒
    4. `SECONDS`：秒
    5. `MINUTES`：分钟
    6. `HOURS`：小时
    7. `DAYS`：天
- `BlockingQueue`
  
    - 任务队列，就是我们提交的任务，里面都是等待被执行的Runnable对象。
    - 当核心线程都在忙的时候，新提交的任务就会被放在队列里等待被执行。如果队列满了，那么就开始创建非核心线程执行任务。
    - 常见的队列类型
        - **SynchronousQueue**：这个队列拿到新的任务之后，会直接提交给线程处理，不会保留任务。如果所有的线程都在工作，那么线程池就创建一个新的线程。但是我们知道**`maximumPoolSize`就是用来限制线程的数目的。**如果**超过**这个值，就会**报错**，所以使用这种队列的时候，可以把`maximumPoolSize`设置为 `Integer.MAX_VALUE`，即**无限大**。
        - **LinkedBlockingQueue**：这个队列接受到任务时，**如果**当前线程数**小于**核心数目，则会**创建**新的线程。如果线程数目已经**达到**核心线程的**数目**，那么新来的任务就会**放入队列**中。这意味着什么？意味着线程的总数目永远都是 <= 核心线程数目，那么，`maximumPoolSize` 这个属性就相当于**废掉**了。
        - **ArrayBlockingQueue**：可以**限定队列的长度**，接收到任务的时候，如果线程的数目，**没有达到**`corePoolSize`，就**新建**核心线程执行任务。如果线程数目**达到**了`corePoolSize`时，还有**新任务**，新来的任务就**进入队列**，当队列**满了**，再**创建非核心线程**帮忙执行任务。如果队列满了，线程数目又达到了`maximumPoolSize`，怎么办呢？这就是涉及到后面的**拒绝策略**了。
        - **DelayQueue**：队列内的元素必须实现**Delayed接口**，这意味着你传进去的任务必须先实现Delayed接口。这个队列接收到新任务时，首先进入队列，然后只有达到制定的延时时间，才会执行任务。(这里有篇讲DelayQueue的文章：[传送门](https://www.jianshu.com/p/5b48180bafce))
- ThreadFactory
  
    - 创建线程的方式，这是一个接口，你new他的时候需要实现他的Thread newThread(Runnable r)方法，可以设置线程的一些属性，比如是否是守护线程、线程名称的前缀、线程优先级等。
- RejectedExecutionHandler
  
    - 简单讲，用来抛异常的。比如当遇到上面两种错误：ArrayBlockingQueue队满，线程数目也到顶时，就要报错；SynchronousQueue那里，线程数目达到maximumPoolSize而引发的错误。就由handler抛异常。
###### 如何添加任务进入线程池？
```java
// execute只支持Runnable参数，并且没有返回值
void execute(Runnable command);
// submit 可以支持Runnable也可以支持Callable，并且有返回值
<T> Future<T> submit(Callable<T> callable);
<T> Future<T> submit(Runnable command, T result);
Future<?> submit(Runnable task);
```
---
##### 常用线程池
一般来讲，Executors提供的线程池已经够用了，如果实在没有符合自己要求的，那么可以自己配置。

而且需要注意 Executors 提供的线程池的阻塞队列，在 new 的时候，capacity 使用的是 `Integer.MAX_VALUE`。

Java通过Executors提供四种线程池，这几个线程池都是直接或者间接通过配置ThreadPoolExecutor的参数实现的。

###### **FixedThreadPool**
- 定长线程池，创建时声明最大的线程数目。超出的线程会在队列中等待。
- 适合执行长期任务，性能好很多。
- 创建方法，两种。一般第一种用法就够了

```java
// nThreads：最大线程数目，即 maximumPoolSize
ExecutorService service = Executors.newFixedThreadPool(nthread);
// threadFactory 创建线程的方法
ExecutorService service = Executors.newFixedThreadPool(nthread, threadFactory);

// ExecutorService 源码
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
```
可以注意到 `corePoolSize` 和 `maximumPoolSize` 的值是相等的，使用的是 LinkedBlockingQueue

###### CachedThreadPool
- 可缓存线程池，线程数目无限制，有空闲线程则复用，没有就创建新的线程。（**数目不限，有闲则用，无闲新建**）。但是如果空闲太久，线程池又会自动地销毁空闲线程。
- 一定程度减少了频繁创建/销毁线程的花销。
- 适合执行很多短期异步的小程序或者负载较轻的任务。
- 创建方法

```java
ExecutorService service = Executors.newCachedThreadPool();

// ThreadPoolExecutor 源码
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                  60L, TimeUnit.SECONDS,
                                  new SynchronousQueue<Runnable>());
}
```
`maximumPoolSize` = `Integer.MAX_VALUE`
这里用的是`SynchronousQueue`队列，这个队列**最终**是**不存储任何元素**的。对于每个put/offer操作,必须等待一个take/poll操作。当线程空闲超过60秒，就销毁线程。

###### ScheduleThreadPool
- 支持定时任务及周期性任务执行
- 创建方法

```java
ExecutorService service = Executors.newScheduleThreadPool(corePoolSize);

// ThreadPoolExecutor源码
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}

//ScheduledThreadPoolExecutor():
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE,
          DEFAULT_KEEPALIVE_MILLIS, MILLISECONDS,
          new DelayedWorkQueue());
}
```
使用的是`DelayQueue`队列
`maximumPoolSize = `Integer.MAX_VALUE`
`DEFAULT_KEEPALIVE_MILLIS` 默认是 10L，这里是10s

###### SingleThreadExecutor
- 单线程的线程池，有且只有一个线程在执行任务。所有任务按照入队的顺序来执行，先来先服务
- 创建方法

```java
ExecutorService singleThreadPool = Executors.newSingleThreadPool();

// ThreadPoolExecutor源码
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>()));
}
```
> LinkedBlockingQueue 队列
---
##### 如何关闭线程池
线程池有创建，那么也需要有关闭。
ExecutorService提供了两个方法来关闭线程池
- shutdown():执行后停止接受新任务，会把队列中的任务执行完毕。
- shutdownNow()：也是停止接受新任务，但会终端所有的任务，将线程池的状态变为stop。
```java
        long start = System.currentTimeMillis();
        for (int i = 0; i <= 5; i++) {
            pool.execute(new Job());
        }

        pool.shutdown();

        while (!pool.awaitTermination(1, TimeUnit.SECONDS)) {
            LOGGER.info("线程还在执行。。。");
        }
        long end = System.currentTimeMillis();
        LOGGER.info("一共处理了【{}】", (end - start));
```
pool.awaitTermination(1, TimeUnit.SECONDS) 会每隔一秒钟检查一次是否执行完毕（状态为 TERMINATED），当从 while 循环退出时就表明线程池已经完全终止了。

那我使用完线程池，不想关闭线程池的话，该如何处理？

很多时候，我们需要等待一个其他的多个线程跑完再继续我们当前线程的任务。比如开启多个任务去FTP多个目录下载图片时，我们使用多线程，一条线程处理一个目录。这样当我们下载完所有的图片后，我们打印一句日志。

```java
    @Override
    public void downloadImage() throws Exception{
        List<String> paths = Arrays.asList("path1", "path2");
        // 任务列表
        List<Future<String>> taskList = new ArrayList<>(paths.size());

        // 遍历违法类型配置信息，开启多线程从 ftp 下载图片
        try{
            for(String path : paths){
                taskList.add(executorService.submit(() -> {
                    log.info(">>>>>>开始下载图片, path: {}<<<<<<", path);
                    downloadImageFromFtp(path);
                    // 处理完成后把路径返回
                    return path;
                }));
            }
            // 阻塞当前线程，直到任务都完成
            for(Future<String> future: taskList){
                // future.get() 获取路径的名称
                // get() 方法会导致当前线程阻塞
                log.info(">>>>>>{}违法类型下载图片图片结束", future.get());
            }
        }catch (RejectedExecutionException e){
            log.error("添加ftp下载任务异常" + e.getMessage(), e);
        }
    }
```



##### [线程池的拒绝策略](https://www.lin2j.tech/archives/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E6%8B%92%E7%BB%9D%E7%AD%96%E7%95%A5)
当线程池中的任务缓存队列已满，并且线程池中的线程数目达到最大线程数量，如果还有任务要到来，就要采用拒绝策略，通常有以下四种：
- `AbortPolicy`：直接抛出 `RejectedExecutionException` 异常并阻止系统正常运行。
- `CallerRunsPolicy`：“调用者运行”机制，该策略既不会抛弃任务，也不会抛出异常，而是将某些任务回退到调用者，由调用者来完成任务。
- `DiscardOldestPolicy`：抛弃队列中等待最久的任务，然后把当前任务加入队列中尝试再次提交当前任务。
- `DiscarePolicy`：直接丢弃任务，不予任何处理也不抛出异常。如果允许任务丢失，这是最好的一种方案。

---