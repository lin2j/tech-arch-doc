---
title: CyclicBarrier 详解
---

# 简介

CyclicBarrier 是一个可循环的（Cyclic）的屏障（Barrier），它的作用是使一组线程到达某个屏障（同步点）时阻塞，直到最后一个线程到达屏障时，屏障才会打开，被屏蔽的线程会被唤醒继续执行任务。

CyclicBarrier 之所以是可循环的，是因为在最后一个线程到达屏障时，会调用 nextGeneration 重置 CyclicBarrier 的计数器，使其进入到初始状态，可以重新使用。

CyclicBarrier 的运行过程使用了 ReentrantLock ，所以它也是基于 AQS 的。

# 使用示例

```java
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.TimeUnit;

public class CyclicBarrierExample {

    /**
     * 使用 CyclicBarrier 控制
     */
    private static void dragonBallUseCyclicBarrier() {
        CyclicBarrier barrier = new CyclicBarrier(7, () -> System.out.println("7 颗龙珠已经集齐，召唤神龙"));

        for (int i = 1; i <= 7; i++) {
            final int j = i;
            new Thread(() -> {
                try {
                    System.out.println(Thread.currentThread().getName() + "\t收集到" + j + "星珠");
                    barrier.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            }, "" + i).start();
        }
    }

    /**
     * 不使用 CyclicBarrier 控制
     */
    private static void dragonBallNotUseCyclicBarrier() {
        for (int i = 1; i <= 7; i++) {
            final int j = i;
            new Thread(() -> {
                System.out.println(Thread.currentThread().getName() + "\t收集到" + j + "星珠");
            }, "" + i).start();
        }
        System.out.println("7 颗龙珠已经集齐，召唤神龙");
    }


    public static void main(String[] args) throws InterruptedException {
        System.out.println("使用 CyclicBarrier 控制");
        dragonBallUseCyclicBarrier();
        TimeUnit.SECONDS.sleep(1);
        System.out.println("========================");
        System.out.println("不使用 CyclicBarrier 控制");
        dragonBallNotUseCyclicBarrier();
    }
}
```

输出结果

```
使用 CyclicBarrier 控制
1	收集到1星珠
2	收集到2星珠
3	收集到3星珠
4	收集到4星珠
5	收集到5星珠
6	收集到6星珠
7	收集到7星珠
7 颗龙珠已经集齐，召唤神龙
========================
不使用 CyclicBarrier 控制
1	收集到1星珠
2	收集到2星珠
3	收集到3星珠
4	收集到4星珠
5	收集到5星珠
6	收集到6星珠
7 颗龙珠已经集齐，召唤神龙
7	收集到7星珠
```

从结果来看，如果不是用 CyclicBarrier 控制的话，就会出现龙珠还没收集，但是神龙已经被召唤的错误。

# 源码详解

对于每一次使用 CyclicBarrier，都会对应一代（generation），并且 CyclicBarrier 在初始化时会去记录参与同步的线程数 $N$，并初始化计数器的计数为 $N$，之后每次有线程到达屏障时，计数器会减一，直到减到 $0$ 时，说明所有的线程都已经到达同步点，则执行任务，并且最后进入下一代。进入下一代时，计数器被重置为 $N$。

## 内部类 Generation

每一次使用 CyclicBarrier，都对应一个 Generation 实例，Generation 在 CyclicBarrier 所有线程到达同步点或者重置时，会被重新实例化，表示进入下一代。

```java
private static class Generation {
    // 用于表示当代是否正常，屏障是否被破坏
    boolean broken = false;
}
```

## 属性

```java
/** 可重入锁，用于保障任意时刻只有一条线程可以进入屏障 */
private final ReentrantLock lock = new ReentrantLock();
/** 等待队列，非最后一条线程到达时，需要进行条件等待 */
private final Condition trip = lock.newCondition();
/** 参与同步的线程数，确定后不再改变 */
private final int parties;
/* 当最后一条线程到达屏障时，需要执行的任务，可以为 null */
private final Runnable barrierCommand;
/** 当前代 */
private Generation generation = new Generation();
/**
 * 当前等待的线程数，每一代都是从 parties 到 0。
 * 当开启新一代或者屏障被破坏时，会被重置为 parties
 */
private int count;
```

## 构造函数

```java
// 创建一个指定参与线程数和屏障任务的 CyclicBarrier
public CyclicBarrier(int parties, Runnable barrierAction) {
    if (parties <= 0) throw new IllegalArgumentException();
    this.parties = parties; // 参与线程数
    this.count = parties; // count 初始化为 parties
    this.barrierCommand = barrierAction; // 屏障任务
}

// 创建一个指定参与线程数的 CyclicBarrier，屏障任务为 null，说明不需要执行额外动作
public CyclicBarrier(int parties) {
    this(parties, null);
}
```

## 核心函数 await

参与同步的线程都是通过调用 await 进入等待状态的，当所有的参与线程都调用 await 时，才会从等待状态被唤醒。如果一条线程是最后到达屏障的，那么它要负责执行屏障任务（barrierCommand），并且唤醒其他的等待线程。

如果线程在 await 期间被中断，那么会抛出 InterruptedException 异常。

以下情况会抛出 BrokenBarrierException 异常：

1. 如果其他线程被中断或者等待超时时；
2. 如果任意线程在等待中，屏障调用了 reset 方法或者 isBroken 返回  true 时；
3. 如果 barrierCommand 抛出异常时；

```java
public int await() throws InterruptedException, BrokenBarrierException {
    try {
        // false 表示无限期等待
        return dowait(false, 0L);
    } catch (TimeoutException toe) {
        throw new Error(toe); // cannot happen
    }
}
```

await 方法比较简单，实际干活的是 doWait 方法。

doWait 方法在真正干活之前会先调用 `lock.lock()` 保证任意时刻只有一个线程在操作屏障，之后：

1. 进行屏障检查、中断检查；

2. 进行计数器自减，看当前是否是最后一条到达屏障的线程，如果是则执行 barrierCommand (不为空的情况下)。之后进入下一代。
3. 如果当前线程不是最后一条线程，那么通过自旋一直等待其他线程到达屏障点；
4. 当等待线程被唤醒时，发现 CyclicBarrier 已经进入下一代了，则释放 lock，并返回。

```java
private int dowait(boolean timed, long nanos)
    throws InterruptedException, BrokenBarrierException,
           TimeoutException {
    final ReentrantLock lock = this.lock;
    // 加锁，保证任意时刻只有一个线程在操作屏障
    lock.lock();
    try {
        // 保存当前代，方便后面判断屏障是否已经进入下一代
        final Generation g = generation;

        // 检查屏障状态
        if (g.broken)
            throw new BrokenBarrierException();

        // 检查当前线程是否被中断
        if (Thread.interrupted()) {
            breakBarrier();
            throw new InterruptedException();
        }

        // 计数自减
        int index = --count;
        if (index == 0) {  // 最后一条到达的线程
            boolean ranAction = false;
            try {
                // 执行任务
                final Runnable command = barrierCommand;
                if (command != null)
                    command.run();
                ranAction = true;
                // 进入下一代，count 会被重置为 parities
                // generation 指向新的实例
                nextGeneration();
                return 0;
            } finally {
                if (!ranAction)
                    breakBarrier();
            }
        }

        // loop until tripped, broken, interrupted, or timed out
        for (;;) {
            try {
                // 线程进入等待队列，进入时会先释放资源，被唤醒后再将资源获取回来
                if (!timed) // 无限等待
                    trip.await();
                else if (nanos > 0L) // 超时等待 nanos
                    nanos = trip.awaitNanos(nanos);
            } catch (InterruptedException ie) {
                if (g == generation && ! g.broken) {
                    breakBarrier();
                    throw ie;
                } else {
                    // We're about to finish waiting even if we had not
                    // been interrupted, so this interrupt is deemed to
                    // "belong" to subsequent execution.
                    Thread.currentThread().interrupt();
                }
            }
          
            // 等待期间，屏障被破坏了
            if (g.broken)
                throw new BrokenBarrierException();

            // 已经进入下一代，可以返回
            if (g != generation)
                return index;

            // 等待超时
            if (timed && nanos <= 0L) {
                breakBarrier();
                throw new TimeoutException();
            }
        }
    } finally {
        // 解锁
        lock.unlock();
    }
}
```

从源码看，当最后一条线程达到并执行完屏障任务后，会调用 nextGeneration 进入下一代。

```java
private void nextGeneration() {
    // 唤醒其他的线程
    trip.signalAll();
    // 进入下一代，做初始化
    count = parties;  // count 重置为 parties
    generation = new Generation(); // 指向新的实例
}
```

### 条件等待 await

在 doWait 方法中，可以看到非最后一条线程到达屏障后，会调用 trip.wait 方法进入条件等待。这个 wait 方法是 AQS 的方法，这里简单解释一下，它会将执行几个动作：

1. 将当前线程放入条件等待队列；
2. 当前线程释放所有的资源，AQS 将资源数 $N$ 保存起来，方便线程从等待中唤醒后可以获取资源数；
3. 确保当前线程已经从同步队列移除，阻塞当前线程进行条件等待；
4. 当前线程被其他线程通过 signal 唤醒，检查中断状态；
5. 重新获取资源数 $N$，响应中断。

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#await()

public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    // 当前线程加入条件队列，并返回节点实例
    Node node = addConditionWaiter();
    // 释放全部的资源，并将原本的资源数保存
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    // 确保当前线程已经从同步队列移除
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this); // 阻塞当前线程
        // 以下是被其他线程唤醒做的操作
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    // 重新获取资源数
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null) // clean up if cancelled
        unlinkCancelledWaiters(); // 将等待队列中的取消节点移除
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

### 唤醒线程 signalAll

signalAll 负责唤醒等待队列中的其他线程，注意这个方法是要在独占模式下调用的，不然会抛出 IllegalMonitorStateException 异常。

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#signalAll
public final void signalAll() {
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    Node first = firstWaiter;
    if (first != null) // 如果队列不为空
        doSignalAll(first); //实际干活是 doSignalAll 方法
}
```

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#doSignalAll
private void doSignalAll(Node first) {
    lastWaiter = firstWaiter = null;
    // 遍历队列中的每个节点，然后将节点从等待队列转移到同步队列
    do {
        Node next = first.nextWaiter;
        first.nextWaiter = null;
        transferForSignal(first); // 转移到同步队列
        first = next; // 向后遍历
    } while (first != null);
}
```

```java
//  java.util.concurrent.locks.AbstractQueuedSynchronizer#transferForSignal
final boolean transferForSignal(Node node) {
    /*
     * If cannot change waitStatus, the node has been cancelled.
     */
    // 将节点的状态从 CONDITION 修改为 0，修改失败则节点转移失败
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;

    /*
     * Splice onto queue and try to set waitStatus of predecessor to
     * indicate that thread is (probably) waiting. If cancelled or
     * attempt to set waitStatus fails, wake up to resync (in which
     * case the waitStatus can be transiently and harmlessly wrong).
     */
    // node 进入同步队列，并返回 node 的前驱节点
    Node p = enq(node);
    int ws = p.waitStatus; // 获取前驱节点的状态 ws
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL)) // ws > 0 表示节点取消了，
                                                                // 否则尝试将前驱节点设置为 SIGNAL
        // 前驱节点取消或者无法修改前驱节点状态为 SIGNAL 时，直接唤醒 node 的线程
        LockSupport.unpark(node.thread);
    return true;
}
```

## 核心函数 reset

reset 方法将 CyclicBarrier 重置到初始状态。调用时如果屏障内有其他的线程正在等待，那么其他的线程会抛出 BrokenBarrierException 异常。*有时候重置还不如重新 new 一个 CyclicBarrier*。

```java
public void reset() {
    final ReentrantLock lock = this.lock;
    lock.lock(); // 加锁
    try {
        breakBarrier();   // 将当前代标记为 毁坏
        nextGeneration(); // 开启新一代
    } finally {
        lock.unlock(); // 解锁
    }
} 
```

```java
private void breakBarrier() {
    generation.broken = true;  // 标记当前代为 毁坏
    count = parties; // 重置 count
    trip.signalAll(); // 唤醒等待的线程
}
```

# 拓展

CountDownLatch 和 CyclicBarrier 的区别

1. CountDownLatch 是一次性的，CyclicBarrier 可以重复使用；
2. CountDownLatch 和 CyclicBarrier 都有到达某个同步点后执行某个动作的作用。但是 CountDownLatch 执行下一个动作的对象是CountDownLatch#await 方法的调用者，而 CyclicBarrier 的执行者是参与线程中的最终到达屏障的线程。

# 参考文章

