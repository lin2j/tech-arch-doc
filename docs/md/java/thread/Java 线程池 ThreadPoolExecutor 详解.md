---
title: 线程池 ThreadPoolExecutor 详解
---

# 线程池的概念

首先系统空闲时在创建大量线程，这些线程的集合成为线程池。线程的生老病死都由线程池来决定。

当有任务到来时，提交给线程池，由线程池来创建或者服用工作线程执行任务。任务执行完成后，线程不会被销毁，而是进入空闲状态。一个线程一个时刻只能执行一个任务，但是却可以向线程池提交多个任务，这些未能及时处理的线程会被到任务队列之中，等待后续被处理。

![ThreadPoolExecutor](https://www.lin2j.tech/blog-image/thread/thread-pool-work.png)

# 线程池的好处

- 降低资源的消耗：线程在创建和销毁时都是很耗费资源和时间的，我们希望通过一种机制，可以避免频繁地创建和销毁线程。

- 提高响应速度：因为线程池中的线程大部分是事先系统在空闲时创建的，所以当有任务到来的时候，可以直接使用已有线程，而不用去创建。任务一来就可以直接执行。

- 控制线程的并发数量：当线程的数目非常多时，我们就需要考虑高并发带来的一系列问题。多个线程可能因为争夺资源而使系统崩溃，运用多线程可以有效的控制线程的数目。

- 提高线程的可管理性：可以对某些线程设定延时执行（DelayQueue)、或者循环执行等策略。

> 即线程复用；控制最大并发数；管理线程

# 线程池的使用

Java  中的线程池一般是使用 ThreadPollExecutor 实现。

```java
// 先看一条创建线程池的语句
ExecutorService service = Executors.newFixedThreadPool(5);
```
在这里需要提到几个接口和类：Executor,  ExecutorService,  Executors,  ThreadPoolExecutor
关于这几个接口和类，这里有篇文章讲得更详细:[传送门](https://josh-persistence.iteye.com/blog/2145120)

- Executor：理解为执行器，内部只要一个执行方法 execute(Runnable command)。是线程池的一个核心接口。
- ExecutorService：继承了Executor，并做了拓展，增加了一堆供程序员开发用的api，所以你用起ExectorService才会那么舒服，其次，它还增加了对线程池生命周期的概念，一个线程池的声明周期有三种状态：运行、关闭和终止。
- Executors：是一个用来创建线程池的工具类（像Collections类的存在），其返回的线程池都是实现了ExecutorService接口。
- ThreadPoolExecutor：该类继承AbstractExecutorService抽象类，实现了ExecutorService接口，内部维护着一个线程池。一般我们只需要通过这个类的构造函数来配置线程池就好了。

通过学习 ThreadPoolExecutor 的参数，来理解线程池内部的结构。

![ThreadPoolExecutor](https://www.lin2j.tech/blog-image/thread/ThreadPoolExecutor.png)

下面先通过一个例子演示线程池的使用，可以结合注释实际运行观察。

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class ThreadPoolExample {

   	/**
     * 线程池
     */
    public static ThreadPoolExecutor executor;

    /**
     * 任务
     */
    private static class Task implements Runnable {
        private Integer number;

        public Task setNumber(int i) {
            this.number = i;
            return this;
        }

        @Override
        public void run() {
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.printf("%s : 执行任务【%d】\n", Thread.currentThread().getName(), number);
        }
    }

    /**
     * 初始化线程池
     */
    private static void initThreadPool() {
        ThreadFactory factory = Executors.defaultThreadFactory();
        executor = new ThreadPoolExecutor(
                5,
                10,
                30,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(10),
                factory);
    }

    /**
     * 打印线程池统计数据
     */
    private static void printStatistic() {
        // 返回目前为止处理过的任务数(已经完成+正在处理+任务队列)
        long taskCount = executor.getTaskCount();
        // 返回目前为止处理完成的任务数
        long completedTaskCount = executor.getCompletedTaskCount();
        // 返回处于活动状态的 Worker 线程数
        long activeWorker = executor.getActiveCount();
        // 返回目前线程池中的线程数
        long poolSize = executor.getPoolSize();
        // 返回线程池的核心线程数
        long corePoolSize = executor.getCorePoolSize();
        String format = "ThreadPool[(%d/%d), task: %d, completed: %d, activeThread: %d]\n";
        System.out.printf(format, poolSize, corePoolSize, taskCount, completedTaskCount, activeWorker);
    }

    public static void main(String[] args) throws Exception {
        // 初始化线程池，设置线程池参数
        initThreadPool();
        // 设置 20 个任务，当线程池超过 15 个任务未处理完成时，
        // 新到来任务后会开启新的任务处理
        int n = 20, i = 0;
        do {
            // 向线程池添加任务
            executor.submit(new Task().setNumber(i));
            i++;
            printStatistic();
        } while (i < n);

        // 下面这个循环运行超过 30 秒，可以看见 poolSize 变为 5
        for(;;) {
            printStatistic();
            TimeUnit.SECONDS.sleep(1);
        }
    }
}
```

# 线程池的参数

下面是 ThreadPoolExecutor 的构造函数，可以看到主要有 $7$ 个参数需要了解。

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
这里对参数进行简单解释

- corePoolSize 

  线程池的核心线程数，当线程池在新建线程时，如果当前池内的线程数小于 corePoolSize，那么创建出来的就是核心线程。

  核心线程默认情况下会一直存在于线程池中，即使这个线程一直不做事。

  不过可以通过 ThreadPoolExecutor 的 `allowCoreThreadTimeOut` 属性，设置其为 true，那么线程池就会去回收长时间不做事的线程了。

- maximumPoolSize

  线程池最大线程数，线程池中的最大线程数目 = 核心线程数 + 非核心线程数。

- keepAliveTime 和 unit 

  非核心线程空闲后的存活时间，该线程池中，非核心线程的如果超过规定的闲置时间会被回收。

- workQueue 

  任务队列，里面都是等待被执行的Runnable对象。

  当核心线程都在忙的时候，新提交的任务就会被放在队列里等待被执行。如果队列满了，那么就开始创建非核心线程执行任务。

  常见的阻塞队列类型

  - SynchronousQueue：这个队列拿到新的任务之后，会直接提交给线程处理，不会保留任务。如果所有的线程都在工作，那么线程池就创建一个新的线程。但是我们知道 maximumPoolSize就是用来限制线程的数目的。如果超过这个值，就会报错，所以使用这种队列的时候，可以把maximumPoolSize设置为 Integer.MAX_VALUE，即无限大。
  - LinkedBlockingQueue：这个队列接受到任务时，如果当前线程数小于核心数目，则会创建新的线程。如果线程数目已经达到核心线程的数目，那么新来的任务就会放入队列中。这意味着什么？意味着线程的总数目永远都是 <= 核心线程数目，那么，maximumPoolSize 这个属性就相当于废掉了。
  - ArrayBlockingQueue：可以限定队列的长度，接收到任务的时候，如果线程的数目，没有达到corePoolSize，就新建核心线程执行任务。如果线程数目达到了corePoolSize时，还有新任务，新来的任务就进入队列，当队列满了，再创建非核心线程帮忙执行任务。如果队列满了，线程数目又达到了maximumPoolSize，怎么办呢？这就是涉及到后面的拒绝策略了。
  - DelayQueue：队列内的元素必须实现Delayed接口，这意味着你传进去的任务必须先实现Delayed接口。这个队列接收到新任务时，首先进入队列，然后只有达到制定的延时时间，才会执行任务。(这里有篇讲DelayQueue的文章：[传送门](https://www.jianshu.com/p/5b48180bafce))

- threadFactory

  创建线程的方式，这是一个接口，定义了一个 `Thread newThread(Runnable r)` 方法，可以设置线程的一些属性，比如是否是守护线程、线程名称的前缀、线程优先级等。

- handler

  当队列和最大线程池都满了之后的拒绝策略，在线程池的线程数达到最大且任务队列容量达到最大时，新到来的任务会执行拒绝策略

## 线程池添加任务
```java
// execute只支持Runnable参数，并且没有返回值
void execute(Runnable command);
// submit 可以支持Runnable也可以支持Callable，并且有返回值
<T> Future<T> submit(Callable<T> callable);
<T> Future<T> submit(Runnable command, T result);
Future<?> submit(Runnable task);
```
## Executors 内置线程池
Executors 会预先配置好几种类型的线程池方便开发者使用，但是不建议直接使用内置的线程池，因为 Executors 提供的线程池的阻塞队列，在 new 的时候，capacity 使用的是 Integer.MAX_VALUE。可以通过模仿 Executors 的参数配置，自己配一个线程池使用。

Java 通过 Executors 提供四种线程池，这几个线程池都是直接或者间接通过配置ThreadPoolExecutor的参数实现的。

### FixedThreadPool
固定数量的线程池，创建时声明最大的线程数目。超出的线程会在队列中等待。适合执行长期任务，性能好很多。

创建方法有两种

```java
// nThreads：最大线程数目，即 maximumPoolSize
ExecutorService service = Executors.newFixedThreadPool(nthread);
// threadFactory 创建线程的方法，可以指定线程工厂
ExecutorService service = Executors.newFixedThreadPool(nthread, threadFactory);

// ExecutorService 源码
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
```
可以注意到 corePoolSize 和 maximumPoolSize 的值是相等的，使用的是 LinkedBlockingQueue

### CachedThreadPool
可缓存线程池，线程数目无限制，有空闲线程则复用，没有就创建新的线程。（数目不限，有闲则用，无闲新建）。但是如果空闲太久，线程池又会自动地销毁空闲线程。

它可以一定程度减少了频繁创建/销毁线程的花销，适合执行很多短期异步的小程序或者负载较轻的任务。

创建方法

```java
ExecutorService service = Executors.newCachedThreadPool();

// ThreadPoolExecutor 源码
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                  60L, TimeUnit.SECONDS,
                                  new SynchronousQueue<Runnable>());
}
```
可以看到 maximumPoolSize 等于 Integer.MAX_VALUE。
这里用的是 SynchronousQueue队列，这个队列是不存储任何元素的。对于每个 put/offer 操作,必须等待一个 take/poll 操作。当线程空闲超过60秒，就销毁线程。

### ScheduleThreadPool
支持定时任务及周期性任务执行。

创建方法

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
### SingleThreadExecutor
单线程的线程池，有且只有一个线程在执行任务。所有任务按照入队的顺序来执行，先来先服务

创建方法

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
# 线程池的关闭

ExecutorService提供了两个方法来关闭线程池

- shutdown():执行后停止接受新任务，会把队列中的任务执行完毕。
- shutdownNow()：也是停止接受新任务，但会终端所有的任务，将线程池的状态变为 STOP。
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
`pool.awaitTermination(1, TimeUnit.SECONDS) ` 会每隔一秒钟检查一次是否执行完毕（状态为 TERMINATED），当从 while 循环退出时就表明线程池已经完全终止了。

# 线程池的状态

为了方便管理线程池，线程池的实现细节中定义了 $5$个状态来表示线程池的生命周期。

```java
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
private static final int COUNT_BITS = Integer.SIZE - 3;
private static final int CAPACITY   = (1 << COUNT_BITS) - 1;

// runState is stored in the high-order bits
private static final int RUNNING    = -1 << COUNT_BITS;
private static final int SHUTDOWN   =  0 << COUNT_BITS;
private static final int STOP       =  1 << COUNT_BITS;
private static final int TIDYING    =  2 << COUNT_BITS;
private static final int TERMINATED =  3 << COUNT_BITS;
```

线程池的状态和工作线程数量记录在一个 ctl 变量之中，该变量是一个整型的原子类，其中 ctl 的高三位用来表示线程池的生命状态，低 29 位用来表示工作线程的数量。

至于为什么要两个信息糅合在一个变量之中，我的浅见是，线程池时刻可能处于多线程的并发使用之中，其生命状态、工作线程的数量可能会被并发的修改，将两个信息放在同一个原子类可以方便状态控制和线程数量的动态调整。

线程池状态和工作线程数量是紧密关联的。例如，当线程池处于运行状态时，可以继续添加新任务并创建新线程；而在线程池关闭或停止时，不再允许添加新任务，并逐渐停止工作线程的执行。将状态和线程数量放在同一个变量中可以更方便地管理这种关联关系。

## 状态转换

从上面的源代码可以知道线程池分别有 $5$ 种状态：RUNNING、SHUTDOWN、STOP、TIDYING、TERMINATED

- RUNNING：高三位为 111，该状态下的线程池会接受新任务并处理，必要时增加新的线程进行处理；
- SHUTDOWN：高三位为 000，该状态下的线程池不会接受新的任务，但是会处理任务队列之中的任务；
- STOP：高三位为 001，该状态下的线程池不会接受新的任务，会中断正在工作的线程，会删除任务队列中的任务；
- TIDYING：高三位为 010，该状态下的线程池所有的任务都已经终止；
- TERMINATED：高三位为 011，该状态下的线程池已经终止。

花点时间捋一下五种状态的大小关系，可以方便理解源代码。

![thread-pool-state](https://www.lin2j.tech/blog-image/thread/thread-pool-state.png)

# 线程池的任务执行

开始之前，讲一下 Woker 内部类的情况。

- Woker 类继承了 AQS 以实现锁功能，可以通过加锁、解锁来协调执行任务与线程池中断之间的控制。
- Woker 实现了 Runnable 接口，在创建线程时，是将 Worker 本身传递给 Thread 的，因此调用 `Thread.start()` 的时候会调用 Worker 的 `run()` 方法。

```java
private final class Worker extends AbstractQueuedSynchronizer implements Runnable {
  			// worker 的工作线程，可能为 null
        final Thread thread;
        // 第一个任务，可能为 null
        Runnable firstTask;
        // 任务计数器
        volatile long completedTasks;
  
        Worker(Runnable firstTask) {
            setState(-1); // 用 -1 来表示工作线程处于未启动状态
            this.firstTask = firstTask;
            // newThread 方法会将 worker 本身作为 task 传递给创建的线程
            this.thread = getThreadFactory().newThread(this);
        }
}
```

线程池执行任务的步骤为 `execute() --> addWorker() --> runWorker() --> getTask() --> run()`

1. 当调用线程池的 `executed()` 或者 `submit()` 方法执行任务时，线程池会先判断是否需要添加新的工作线程，来决定要不要调用 `addWorker()` 方法增加新的工作线程。如果没有新增工作线程，则将任务放到任务队列之中。

2. `addWorker()` 方法在 ReentrantLock 的帮助下，将新增的 Woker 添加到 `workers` 工作线程集合之中，然后将 Woker 之中的线程启动，当 thread 调用 `start()` 方法时，接着会调用 Worker 的 `run()` 方法，进而执行 `runWoker()` 方法。

3. `runWoker()`  中， 如果发现 firstTask 为 null，则工作线程会去调用 `getTask()` 方法获取新的任务执行。任务启动之前会检查线程池的状态是否是 RUNING 或者 SHUTDOWN，这两种状态才可以继续执行任务。

4. `getTask()` 方法是向任务队列获取新的任务以执行，如果任务队列没有新的任务，则方法会阻塞或者超时等待，存在部分情况该方法会返回 null，此时意味着工作线程即将终止。
5. 每个 Task 都是 Runnable 实现类，因此在 `runWoker()` 方法内部直接执行其 `run()` 方法。

![thread-pool-execute](https://www.lin2j.tech/blog-image/thread/thread-pool-execute.png)



## execute() 方法

```java
public void execute(Runnable command) {
    if (command == null)
        throw new NullPointerException();
  
    int c = ctl.get();
    // 如果工作线程少于配置的核心线程数，则增加工作线程
    if (workerCountOf(c) < corePoolSize) {
        // 存在工作线程新增失败的情况
        if (addWorker(command, true))
            return;
        c = ctl.get();
    }
    // 在线程池处于 RUNING 状态下，如果核心线程不能新增，则将新的任务放到任务队列
    if (isRunning(c) && workQueue.offer(command)) {
        int recheck = ctl.get();
        // 这里对线程池的状态进行二次检查，因为从进入到这个方法到现在，
        // 在多线程的环境下可能线程池已经处于非 RUNNING 状态
        // 非 RUNNING 状态下，不会接受新的任务，所以把任务从任务队列删除
        if (! isRunning(recheck) && remove(command))
            // 无法执行新任务，则执行拒绝策略
            reject(command);
        else if (workerCountOf(recheck) == 0) // 如果处于 RUNNING 状态，但是一条工作线程都没有，则新增工作线程
            // 因为自上次检查线程池状态以来，可能存在现有的工作线程终止的情况
            addWorker(null, false);
    }
    else if (!addWorker(command, false)) // 如果任务不能入队，说明任务队列满了，此时增加非核心工作线程处理任务
        reject(command);
}
```

## addWorker() 方法

```java
/**
 * 检查当前线程池状态下是否可以新增工作线程。
 * 
 * 以下条件下返回 false
 * 1. 线程池已经处于关闭状态
 * 2. 线程工厂创建新的线程失败
 * 3. 因为其他异常错误导致线程无法启动，会做一些回退的操作
 *
 * @param firstTask 作为工作线程的第一个任务，如果为 null，则工作线程从任务队列获取任务
 * @param core 是否是核心线程
 * @return true if successful
 */
private boolean addWorker(Runnable firstTask, boolean core) {
    retry:
    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);

        // rs >= SHUTDOWN 表示线程池处于关闭状态，可以看一下几种状态的大小关系
        // 如果线程池处于 SHUTDOWN 状态，但是任务队列没有为空，可能会增加工作线程加快任务处理
        if (rs >= SHUTDOWN &&
            ! (rs == SHUTDOWN &&
               firstTask == null &&
               ! workQueue.isEmpty()))
            return false;	
      
        // CAS 更新工作线程的数量
        for (;;) {
            int wc = workerCountOf(c);
            // 线程数量超过限制，则直接返回 false
            if (wc >= CAPACITY ||
                wc >= (core ? corePoolSize : maximumPoolSize))
                return false;
            // 尝试更新工作线程数量，可能会失败，如果失败，则回到 retry 循环开头
            if (compareAndIncrementWorkerCount(c)) 
                break retry;
            c = ctl.get();  // Re-read ctl
            if (runStateOf(c) != rs)
                continue retry;
            // else CAS failed due to workerCount change; retry inner loop
        }
    }

    boolean workerStarted = false;
    boolean workerAdded = false;
    Worker w = null;
    try {
        // 创建 Worker 对象
        w = new Worker(firstTask);
        // 上面有提到 w.thread 内部的 runnable 对象是 w 本身，
        // 所以 t.start() 是执行 worker 的 run() 方法
        final Thread t = w.thread;
        if (t != null) {
            // this.mainLock 是一个 ReentrantLock 对象
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();
            try {
                // 在获取锁的过程中，线程池的状态可能已经改变，所以这里需要重新检查
                int rs = runStateOf(ctl.get());

                if (rs < SHUTDOWN ||
                    (rs == SHUTDOWN && firstTask == null)) {
                    if (t.isAlive()) // precheck that t is startable
                        throw new IllegalThreadStateException();
                    // 添加到工作线程集合
                    workers.add(w);
                    int s = workers.size();
                    if (s > largestPoolSize)
                        // 记录线程池的最大工作线程数
                        largestPoolSize = s;
                    workerAdded = true;
                }
            } finally {
                mainLock.unlock();
            }
            if (workerAdded) {
                // 启动工作线程
                t.start();
                workerStarted = true;
            }
        }
    } finally {
        if (! workerStarted) 
            // 启动失败则进行回退操作
            addWorkerFailed(w);
    }
    return workerStarted;
}

/**
 * 回退工作线程的创建
 * - 如果 w 不为 null，则从工作线程集合中移除
 * - 减少工作线程数亩
 * - 重新检查终止状态，以防止因为 Woker 线程导致阻碍了线程池的终止
 */
private void addWorkerFailed(Worker w) {
  final ReentrantLock mainLock = this.mainLock;
  mainLock.lock();
  try {
    if (w != null)
      workers.remove(w);
    decrementWorkerCount();
    tryTerminate();
  } finally {
    mainLock.unlock();
  }
}
```

## runWorker() 方法

```java
/**
 * 执行工作线程，重复地从任务队列获取任务并执行。
 * 启动工作线程执行任务之前，woker 会先尝试获取锁，线程池中断工作线程的情况下执行任务
 *
 * 1. 每个任务执行之前都会调用 beforeExecute(Thread t, Runnable r) 执行前置操作
 *    该方法可能抛出异常，抛出异常则会导致工作线程终止
 * 2. 任务正常执行之后，会调用 afterExecute(Runnable r, Throwable t) 执行后置操作
 * 3. 执行任务的过程中抛出的异常会被收集起来，然后调用 afterExecute  执行后置操作，
 *    因为 Runnable.run() 方法不能抛出异常，所以抛出的异常是交给线程的 
 *    UncaughtExceptionHandler 处理
 * 4. 需要注意的是 afterExecute 执行过程中如果抛出异常，同样会导致工作线程终止
 * 
 */
final void runWorker(Worker w) {
    Thread wt = Thread.currentThread();
    Runnable task = w.firstTask;
    w.firstTask = null;
    // 先释放锁，因为线程池可能正在中止工作线程
    w.unlock(); 
    // 当工作线程因为用户异常而导致终止时，completedAbruptly 会为 true
    boolean completedAbruptly = true;
    try {
        while (task != null || (task = getTask()) != null) {
            // 加锁，防止在执行任务期间，线程池对工作线程进行中断
            w.lock();
            // 检查线程池状态和线程状态，如果线程池已经终止，则要保证线程已经中断
            // 如果线程没有中断，则要将线程标记为中断
            if ((runStateAtLeast(ctl.get(), STOP) ||
                 (Thread.interrupted() &&
                  runStateAtLeast(ctl.get(), STOP))) &&
                !wt.isInterrupted())
                wt.interrupt();
            try {
                // 前置操作，可能抛出异常
                beforeExecute(wt, task);
                Throwable thrown = null;
                try {
                    task.run();
                } catch (RuntimeException x) {  // 收集异常
                    thrown = x; throw x;
                } catch (Error x) {
                    thrown = x; throw x;
                } catch (Throwable x) {
                    thrown = x; throw new Error(x);
                } finally {
                    // 后置操作，抛出异常会导致线程终止
                    afterExecute(task, thrown);
                }
            } finally {
                // task 设为 null，方便下个循环判断从任务队列获取任务
                task = null;
                // 统计工作线程已完成的任务数
                w.completedTasks++;
                // 解锁
                w.unlock();
            }
        }
        completedAbruptly = false;
    } finally {
        // 工作线程退出处理
        processWorkerExit(w, completedAbruptly);
    }
}
```

## getTask() 方法

```java
/**
 * 阻塞或者超时等待获取任务，取决于当前的线程池配置。
 * 以下情况会返回 null
 * 1. 该工作线程不是核心线程，即当前线程数量超过核心线程数 corePoolSize
 * 2. 线程池处于 STOP 状态
 * 3. 线程池处于 SHUTDOWN 状态，并且队列已经空了
 * 4. 超时等待
 *    4.1 allowCoreThreadTimeOut 设置为 true 表示核心线程获取任务也会超时
 *    4.2 或者当前线程是非核心线程
 */
private Runnable getTask() {
    boolean timedOut = false; // Did the last poll() time out?

    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);

        // 判断线程池状态是否处于 STOP 或者 SHUTDOWN，SHUTDOWN 状态还得判断任务队列是否为空
        if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
            decrementWorkerCount();
            return null;
        }

        int wc = workerCountOf(c);

        // Are workers subject to culling?
        boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;

        // 核心线程和非核心线程超时回收（timedOut 只有在经历过一轮超时获取之后才会变为 true）
        // wc > 1 || workQueue.isEmpty() 当前线程不是最后一条，或者任务队列已经空了，此时回收线程
        if ((wc > maximumPoolSize || (timed && timedOut))
            && (wc > 1 || workQueue.isEmpty())) {
            if (compareAndDecrementWorkerCount(c))
                return null;
            continue;
        }

        try {
            // 超时等待
            Runnable r = timed ?
                workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                workQueue.take();
            if (r != null)
                return r;
            timedOut = true;
        } catch (InterruptedException retry) {
            timedOut = false;
        }
    }
}
```

# 线程池的拒绝策略

当线程池中的任务缓存队列已满，并且线程池中的线程数目达到最大线程数量，如果还有任务要到来，就要采用拒绝策略，通常有以下四种：

- AbortPolicy：直接抛出 RejectedExecutionException 异常并阻止系统正常运行。
- CallerRunsPolicy：“调用者运行”机制，该策略既不会抛弃任务，也不会抛出异常，而是将某些任务回退到调用者，由调用者来完成任务。
- DiscardOldestPolicy：抛弃队列中等待最久的任务，然后把当前任务加入队列中尝试再次提交当前任务。
- DiscarePolicy：直接丢弃任务，不予任何处理也不抛出异常。如果允许任务丢失，这是最好的一种方案。

下面各个拒绝策略所使用的线程池的配置以及验证的代码逻辑基本相同，除了拒绝策略的选型。

使用的依赖有个谷歌的 `guava` 依赖，用来自定义一个 `ThreadFactory` 。

```xml
<!-- https://mvnrepository.com/artifact/com.google.guava/guava -->
<dependency>
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>20.0</version>
</dependency>
```

下面是源码，可以在看某个拒绝策略的时候，跑一遍，看看结果和我一不一样。

```java
import com.google.common.util.concurrent.ThreadFactoryBuilder;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 自己配置线程池，并比较四种拒绝策略的不同
 */
public class MyThreadPoolDemo {

        // 创建一个线程池，它最多有个 2 条线程在工作，然后队列的容量可以容纳最多3个任务
        ExecutorService service = new ThreadPoolExecutor(
                2,
                2,
                2L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(3),
                new ThreadFactoryBuilder().setNameFormat("policy-thread-%d").build(),
//                new ThreadPoolExecutor.DiscardPolicy()
//                new ThreadPoolExecutor.CallerRunsPolicy()
                new ThreadPoolExecutor.AbortPolicy()
//                new ThreadPoolExecutor.DiscardOldestPolicy()
        );

        // 这里假设有10个任务在很短的时间内相继到来
        for (int i = 0; i < 10; i++) {
//            try{ TimeUnit.SECONDS.sleep(2);}catch (InterruptedException e) {e.printStackTrace();}
            try {
                int finalI = i;
                service.execute(() -> {
                            System.out.println(Thread.currentThread().getName() + "\t 开始下载图片 " + finalI);
                            try {
                                TimeUnit.SECONDS.sleep(3);
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                            }
                            System.out.println(Thread.currentThread().getName() + "\t 下载图片完成 " + finalI);
                        }
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        service.shutdown();
    }

}
```

## AbortPolicy

这是默认的拒绝策略。

`ThreadPoolExecutor` 有这样一句源码。

```java
    /**
     * The default rejected execution handler
     */
    private static final RejectedExecutionHandler defaultHandler =
        new AbortPolicy();
```

从 `AbortPolicy` 实现的 `rejectedExecution(Runable, ThreadPoolExecutor)` 方法可以看出，它是直接抛出异常的。

```java
public static class AbortPolicy implements RejectedExecutionHandler {
    public AbortPolicy() { }

    /**
     * 总是抛出 RejectedExecutionException
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        throw new RejectedExecutionException("Task " + r.toString() +
                                             " rejected from " +
                                             e.toString());
    }
}
```

下面是使用该拒绝策略时的运行结果。是否和你想的一样呢？

这里加上我对这个结果的思考。(截图中的  知道  应该是 直到，打错字了)	

![AbortPolicy](https://www.lin2j.tech/blog-image/thread/AbortPolicy.png)

## CallerRunPolicy

```java
/**
  * 线程池拒绝执行任务，并且直接将任务返回给调用了线程池的 execute 方法的线程。
  * 如果线程池已经关闭，那么任务不会返回给调用者。
  */
public static class CallerRunsPolicy implements RejectedExecutionHandler {
    public CallerRunsPolicy() { }

    /**
     * 在调用 execute 方法的线程执行任务。如果线程池已经关闭，那么就不执行任务。
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            r.run();
        }
    }
}
```

对于这个拒绝策略，其实每次运行的结果不一定相同。但是对于我们要证明的策略的表现，是没有影响的。

![CallerRunsPolicy](https://www.lin2j.tech/blog-image/thread/CallerRunsPolicy.png)

## DiscardOldestPolicy

```java
/**
  * 将队列中最早的的任务去掉，然后尝试执行 execute 方法，将新的任务放入线程池执行
  * 如果线程池已经关闭，那么任务就不再执行。
  */
public static class DiscardOldestPolicy implements RejectedExecutionHandler {
    public DiscardOldestPolicy() { }

    /**
      * 拿到队列中最新的未执行的任务，并直接丢弃掉。
      * 如果线程池已经关闭，那么任务就不再执行。
      */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            e.getQueue().poll();
            e.execute(r);
        }
    }
}
```

运行结果如下。

![DiscardOldestPolicy](https://www.lin2j.tech/blog-image/thread/DiscardOldestPolicy.png)

## DiscardPolicy

```java
/**
 * 将被拒绝的任务忽略掉，不执行也不报错
 */
public static class DiscardPolicy implements RejectedExecutionHandler {
    public DiscardPolicy() { }

    /**
     * 对于新来的任务什么也不做
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
    }
}
```

![DiscardPolicy](https://www.lin2j.tech/blog-image/thread/DiscardPolicy.png)



# 参考文章

- https://pdai.tech/md/java/thread/java-thread-x-juc-executor-ThreadPoolExecutor.html
