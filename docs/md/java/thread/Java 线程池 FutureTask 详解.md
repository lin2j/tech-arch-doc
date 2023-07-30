---
title: Future & FutureTask 详解
---

# FutureTask 的作用

Future 接口代表一个异步计算操作的结果，并且提供了各种方法用来控制这个计算操作，比如等待完成、获取结果、取消计算、计算状态。区别于阻塞等待，将计算过程交给子线程之后，主线程可以执行其他操作，等待异步操作完成后再获取结果，这样可以提高整个程序的运行效率。

而 FutureTask 是 Future 的接口实现，提供了上述各个操作的实现之外，本身也是一个任务，实现了 Runnable 接口，可以作为任务传递给线程。

FutureTask 通过为任务设置状态变化和封装等待线程链表的方式，来保证任务执行、结果获取的逻辑性，以及阻塞等待获取结果的能力。

# FutureTask 的使用

常见的使用方式是将 Callable 通过 `ExecutorService.submit()` 方法提交给线程池，这样线程池会返回一个 Future 类，底层实现就是 FutureTask。

示例一：

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * @author linjinjia
 * @date 2023/7/12 12:07
 */
public class FutureTaskExample {

    /**
     * 求和任务
     */
    private static class SumTask implements Callable<Integer> {
        /**
         * 起始数
         */
        private final int start;
        /**
         * 终止数
         */
        private final int end;

        public SumTask(int start, int end) {
            this.start = start;
            this.end = end;
        }

        @Override
        public Integer call() throws Exception {
            System.out.printf("%s: 计算区间：[%d, %d)\n", Thread.currentThread().getName(), start, end);
            int sum = 0;
            for (int i = start; i < end; i++) {
                sum += i;
            }
            // 睡眠 1 秒模拟计算耗时
            TimeUnit.SECONDS.sleep(1);
            return sum;
        }
    }

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        int n = 100, step = 20;
				// 线程池最多有 3 条线程
        ExecutorService executor = Executors.newFixedThreadPool(3);
        List<Future<Integer>> futures = new ArrayList<>();
        for (int i = 1; i <= n; i += step) {
            // 添加任务
            Future<Integer> future = executor.submit(new SumTask(i, i + step));
            futures.add(future);
        }

        int sum = 0;
        for (Future<Integer> future : futures) {
            // 等待计算结果
            sum += future.get();
        }
        System.out.println(sum);

        // 关闭线程池，回收资源
        executor.shutdown();
    }
}
```

示例二：

```java
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;

/**
 * @author linjinjia
 * @date 2023/7/12 12:07
 */
public class FutureTaskExample2 {

    private static class SumTask implements Callable<Integer> {

        @Override
        public Integer call() throws Exception {
            // 睡眠 1 秒模拟计算耗时
            TimeUnit.SECONDS.sleep(2);
            return 1;
        }
    }

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 线程池只有一条线程
        ExecutorService executor = Executors.newFixedThreadPool(1);

        FutureTask<Integer> task1 = new FutureTask<>(new SumTask());
        FutureTask<Integer> task2 = new FutureTask<>(new SumTask());

        executor.submit(task1);
        executor.submit(task2);

        System.out.println("task2 已完成：" + task2.isDone());
        System.out.println("task1 结果: " + task1.get());
        System.out.println("task2 已完成：" + task2.isDone());
        System.out.println("task2 结果: " + task2.get());
        System.out.println("task2 已完成：" + task2.isDone());

        executor.shutdown();
    }
}
```

# Future 和 FutrueTask 的关系

![FutureTask](https://www.lin2j.tech/blog-image/thread/FutureTask.png)

FutureTask 实现了 RunnableFuture 接口，而 RunnableFuture 是继承了 Runnable 和 Future 接口，因此 FutureTask 具备了 Runnbale 的作用和 Future 的能力。

除此之外，FutureTask 还依赖 Callable 作为其内部成员变量。

下面介绍 Future 定义的方法。

```java
public interface Future<V> {

    /**
     * 尝试取消任务，如果任务已经完成、被取消过，则取消失败，或者其他原因导致取消失败。
     * 执行过这个方法之后，接下来调用 isDone 方法永远会返回 true，
     * 如果 cancel 方法返回 true，则 isCancelled 也会返回 true
     *
     * @param mayInterruptIfRunning 如果为 true，则执行任务的线程会被强行中断，否则的会等待任务完成
     */
    boolean cancel(boolean mayInterruptIfRunning);

    /**
     * 正常完成任务的情况下，该方法会返回 true
     */
    boolean isCancelled();

    /**
     * 返回任务是否已经完成
     * 完成的情况包括：正常结束、异常结束、被取消
     */
    boolean isDone();

    /**
     * 获取结果，如果计算还未结束，
     * @throws CancellationException 如果计算被取消
     * @throws ExecutionException 如果计算过程抛出了一场
     * @throws InterruptedException 如果负责计算的线程在等待时中断
     */
    V get() throws InterruptedException, ExecutionException;

    /**
     * 超时等待获取结果
     *
     * @param 超时时间
     * @param 时间单位
     * @throws CancellationException 如果计算被取消
     * @throws ExecutionException 如果计算过程抛出了一场
     * @throws InterruptedException 如果负责计算的线程在等待时中断
     * @throws TimeoutException 如果等待超时
     */
    V get(long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

# FutureTask 的状态

为了方便管理 FutureTask，作者为 FutureTask 定义了 $7$ 种状态。

```java
// 表示当前任务的状态，是一个 volatile 变量，这样状态的变化对其他线程可见
private volatile int state;
// 初始状态，表示任务刚创建或者还未完成
private static final int NEW          = 0;
// 中间状态，表示任务已经完成或者抛出了一场，但是任务的结果（异常）还未保存
private static final int COMPLETING   = 1;
// 最终状态，表示任务已经完成并且结果已经保存
private static final int NORMAL       = 2;
// 最终状态，表示任务执行过程中出现了异常，并且异常已经被保存
private static final int EXCEPTIONAL  = 3;
// 最终状态，表示任务在未开始或者开始未完成的情况下，用户调用了 cancel(false) 导致任务取消
private static final int CANCELLED    = 4;
// 中间状态，表示任务在未开始或者开始未完成的情况下，
// 用户调用了 cancel(true) 导致任务被取消且正在中断执行线程（还未成功中断）
private static final int INTERRUPTING = 5;
// 最终状态，表示任务执行线程被中断
private static final int INTERRUPTED  = 6;
```

对于大于等于 COMPLETING （即 `state != NEW`）的状态，都是属于已完成状态，`isDone()` 方法会返回 true。

![FutureTask-state](https://www.lin2j.tech/blog-image/thread/FutureTask-state.png)

# FutureTask 源码解析

## 核心属性

```java
/**
 * 任务的状态
 */
private volatile int state;

/**
 * 内置的 Callable 任务，任务结束后置空
 */
private Callable<V> callable;

/**
 * 保存从 get() 方法返回的结果或者异常
 */
private Object outcome; // non-volatile, protected by state reads/writes

/**
 * callable 任务的执行线程，在 run() 方法中使用 CAS 进行设置
 */
private volatile Thread runner;

/**
 * 使用 Treiber 栈保存等待线程
 * Treiber 栈是一种无锁并发栈，其无锁的特性是基于CAS原子操作实现的
 */
private volatile WaitNode waiters;
```

## 构造函数

FutureTask 有两个构造函数，分别用来接收 Callable 和 Runnable 对象。

```java
/**
 * 创建 FutureTask 对象，并执行给定的 Callable 对象
 */
public FutureTask(Callable<V> callable) {
    if (callable == null)
        throw new NullPointerException();
    this.callable = callable;
    // 初始状态
    this.state = NEW;       // ensure visibility of callable
}

/**
 * 创建 FutureTask 对象，并执行给定的 Runnable 对象，
 * 同时还接收一个 result 作为任务成功执行之后的返回结果。
 * 如果不需要返回结果，可以考虑使用 
 * Future<?> f = new FutureTask<Void>(runnable, null) 的方式
 */
public FutureTask(Runnable runnable, V result) {
  this.callable = Executors.callable(runnable, result);
  // 初始状态
  this.state = NEW;       // ensure visibility of callable
}
```

在第二个构造函数中，对于传入的 Runnable 对象，使用 `Executors.callable()` 方法成 Callable 对象。该方法时 Executors 中的一个方法，其实现逻辑使用一个 Runnable 适配器，将 Runnable 对象包装成 Callable 对象。

```java
// java.util.concurrent.Executors

public static <T> Callable<T> callable(Runnable task, T result) {
  if (task == null)
    throw new NullPointerException();
  return new RunnableAdapter<T>(task, result);
}

/**
 * Runnable 适配器实现了 Callable 接口
 */
static final class RunnableAdapter<T> implements Callable<T> {
  final Runnable task;
  final T result;
  RunnableAdapter(Runnable task, T result) {
    this.task = task;
    this.result = result;
  }
  public T call() {
    task.run();
    return result;
  }
}
```

## 内部类 WaitNode

```java
/**
 * 简单的链表节点
 * 以 Treiber 栈的形式记录等待获取结果的线程
 * 构造函数会记录当前线程
 */
static final class WaitNode {
    volatile Thread thread;
    volatile WaitNode next;
    WaitNode() { thread = Thread.currentThread(); }
}
```

## 任务的执行 run()

```java
/**
 * 执行任务
 * 
 * 1. 先判断任务状态是否是初始状态 NEW，然后将当前线程设置任务的执行线程；
 * 2. 调用内置的 callable 对象的 run 方法，然后保存执行结果或者异常、更新状态、唤醒等待线程
 * 3. 如果任务被中断，会调用 `handlePossibleCancellationInterrupt` 方法来
 *    保证保证方法退出前，state 进入 INTERRUPTED 状态
 */
public void run() {
    // 确认任务处于初始状态，以及通过 CAS 设置当前线程为执行线程
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                     null, Thread.currentThread()))
        return;
    try {
        Callable<V> c = callable;
        if (c != null && state == NEW) {
            V result;
            boolean ran;
            try {
                // 调用 call() 方法
                result = c.call();
                ran = true;
            } catch (Throwable ex) {
                result = null;
                ran = false;
                // 保存异常，更新任务状态和唤醒等待线程
                setException(ex);
            }
            if (ran)
                // 保存结果，更新任务状态和唤醒等待线程
                set(result);
        }
    } finally {
        // 将 runner 设置为 null，防止并发调用 run() 方法
        runner = null;
        int s = state;
        // 如果正在中断中或者已中断，说明调用了 cancel(true) 方法
        // 因此这里需要保证 cancel 方法中把 state 设为 INTERRUPTED
        if (s >= INTERRUPTING)
            // 保证方法退出前，state 进入 INTERRUPTED 状态
            handlePossibleCancellationInterrupt(s);
    }
}

/**
 * 将任务状态更新为 COMPLTING，然后保存结果，再更新为 NORMAL
 * 最终唤醒所有的等待线程
 */
protected void set(V v) {
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        outcome = v;
        UNSAFE.putOrderedInt(this, stateOffset, NORMAL); // final state
        finishCompletion();
    }
}

/**
 * 将任务状态更新为 COMPLTING，然后保存异常，再更新为 EXCEPTIONAL
 * 最终唤醒所有的等待线程
 */
protected void setException(Throwable t) {
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        outcome = t;
        UNSAFE.putOrderedInt(this, stateOffset, EXCEPTIONAL); // final state
        finishCompletion();
    }
}

private void handlePossibleCancellationInterrupt(int s) {
    // It is possible for our interrupter to stall before getting a
    // chance to interrupt us.  Let's spin-wait patiently.
    if (s == INTERRUPTING)
      while (state == INTERRUPTING)
        Thread.yield(); // wait out pending interrupt

    // assert state == INTERRUPTED;

    // We want to clear any interrupt we may have received from
    // cancel(true).  However, it is permissible to use interrupts
    // as an independent mechanism for a task to communicate with
    // its caller, and there is no way to clear only the
    // cancellation interrupt.
    //
    // Thread.interrupted();
}
```

## 任务的取消 cancel()

```java
/**
 * 尝试取消任务，如果任务已经完成、被取消过，则取消失败，或者其他原因导致取消失败。
 * 执行过这个方法之后，接下来调用 isDone 方法永远会返回 true，
 * 如果 cancel 方法返回 true，则 isCancelled 也会返回 true
 *
 * @param mayInterruptIfRunning 如果为 true，则执行任务的线程会被强行中断，否则的会等待任务完成
 */
public boolean cancel(boolean mayInterruptIfRunning) {
    // 根据 mayInterruptIfRunning 选择进入中断中还是取消
    if (!(state == NEW &&
          UNSAFE.compareAndSwapInt(this, stateOffset, NEW,
              mayInterruptIfRunning ? INTERRUPTING : CANCELLED)))
        return false;
    try {    // in case call to interrupt throws exception
        if (mayInterruptIfRunning) {
            // 中断线程
            try {
                Thread t = runner;
                if (t != null)
                    t.interrupt();
            } finally { // final state
                // 将状态更新为已中断
                UNSAFE.putOrderedInt(this, stateOffset, INTERRUPTED);
            }
        }
    } finally {
        // 唤醒等待线程
        finishCompletion();
    }
    return true;
}
```

## 等待线程的唤醒  finishCompletion()

```java
/**
 * 唤醒所有的等待线程，
 * 然后调用 done() 方法，并且将 callable 设置为 null
 */
private void finishCompletion() {
    // assert state > COMPLETING;
    for (WaitNode q; (q = waiters) != null;) {
        // 先将 waiters 置为 null
        if (UNSAFE.compareAndSwapObject(this, waitersOffset, q, null)) {
            // 然后在循环里，从头到尾唤醒节点中封装的线程
            for (;;) {
                // 将节点的 thread 置为 null, 并唤醒线程
                Thread t = q.thread;
                if (t != null) {
                    q.thread = null;
                    LockSupport.unpark(t);
                }
                // 遍历下一个节点
                WaitNode next = q.next;
                if (next == null)
                    break;
                q.next = null; // unlink to help gc
                q = next;
            }
            break;
        }
    }

    done();

    callable = null;        // to reduce footprint
}
```

## 结果的获取 get()

`get()` 方法在 state 为未完成或即将完成的状态下，通过 `awaitDone()` 方法实现阻塞等待的，并在 `report()` 方法中根据状态 state 返回结果或者抛出异常。 

```java
/**
 * 阻塞等待
 */
public V get() throws InterruptedException, ExecutionException {
    int s = state;
    if (s <= COMPLETING)
        s = awaitDone(false, 0L);
    return report(s);
}

/**
 * 超时等待
 */
public V get(long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException {
    if (unit == null)
        throw new NullPointerException();
    int s = state;
    if (s <= COMPLETING &&
        // 判断当前状态如果是 NEW 或者 COMPLETING，那么就是超时了
        (s = awaitDone(true, unit.toNanos(timeout))) <= COMPLETING) 
        throw new TimeoutException();
    return report(s);
}

/**
 * 根据不同的状态返回结果或者抛出异常
 */
@SuppressWarnings("unchecked")
private V report(int s) throws ExecutionException {
    // 结果
    Object x = outcome;
    if (s == NORMAL)
      // 正常完成
      return (V)x;
    if (s >= CANCELLED)
      // 抛出取消异常，表示处理过程中，任务被取消了
      throw new CancellationException();
    // 抛出执行过程中的异常
    throw new ExecutionException((Throwable)x);
}

/**
 * 将当前线程放入等待列表，根据超时参数进行阻塞
 * 
 * 返回任务的状态 state
 */
private int awaitDone(boolean timed, long nanos)
    throws InterruptedException {
    final long deadline = timed ? System.nanoTime() + nanos : 0L;
    WaitNode q = null;
    boolean queued = false;
    // 无限循环，循环体中有很多 if-else 分支，
    // 每次循环会根据条件进入某一个分支 
    for (;;) {
        // 如果当前线程被中断
        // 则不进入等待列表，或者从等待列表中移除
        if (Thread.interrupted()) {
            removeWaiter(q);
            throw new InterruptedException();
        }
				
        int s = state;
        // s > COMPLETING 意味任务已经完成、被取消或者中断
        // 不需要进入等待队列
        if (s > COMPLETING) {  // 分支①
            if (q != null)
                q.thread = null;
            return s;
        }
        else if (s == COMPLETING) // 能到达这里，说明 s 为 NEW 或者 COMPLETING
            // 如果任务即将完成，则线程暂时释放 CPU 时间片资源进行等待
            // 下一循环可能会进入分支①
            Thread.yield();
        else if (q == null) // 能到达这里，说明 s 为 NEW
            // 将当前线程封装成等待节点
            q = new WaitNode();
        else if (!queued) // s 为 NEW，且 q 还未入队（可能没入过队，也可能上次入队失败）
            // CAS 的方式将 q 插入到当前 waiters 前面，然后 waiters 指向 q
            queued = UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                    q.next = waiters, q);
        else if (timed) {  // s 为 NEW，且 q 已经入队，当前线程可以阻塞等待唤醒
            nanos = deadline - System.nanoTime();
            if (nanos <= 0L) { // 等待已经超时，将 q 从等待队列移除
                removeWaiter(q);
                return state;
            }
            LockSupport.parkNanos(this, nanos);
        }
        else
            LockSupport.park(this); // 无限等待
    }
}
```

## 任务的重启 runAndReset()

`runAndReset()` 和 `run()` 方法最大的区别是 `runAndReset()` 不需要设置返回值，并且在执行过程中如果没有抛异常或者被执行线程被中断，是不会改变任务状态的。它用于执行需要多次执行的任务上。

```java
protected boolean runAndReset() {
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                     null, Thread.currentThread()))
        return false;
    boolean ran = false;
    int s = state;
    try {
        Callable<V> c = callable;
        if (c != null && s == NEW) {
            try {
                c.call(); // don't set result
                ran = true;
            } catch (Throwable ex) {
                setException(ex);
            }
        }
    } finally {
        // runner must be non-null until state is settled to
        // prevent concurrent calls to run()
        runner = null;
        // state must be re-read after nulling runner to prevent
        // leaked interrupts
        s = state;
        if (s >= INTERRUPTING)
            handlePossibleCancellationInterrupt(s);
    }
    return ran && s == NEW;
}
```

# 参考文章

- https://pdai.tech/md/java/thread/java-thread-x-juc-executor-FutureTask.html
- https://www.cnblogs.com/linghu-java/p/8991824.html以及https://www.jianshu.com/p/d61d7ffa6abc
