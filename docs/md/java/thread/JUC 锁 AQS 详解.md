---
title: AQS 详解
---



# AQS 简介

AQS 即 AbstractQueuedSynchronizer 类，是一个用来实现同步器和锁的框架。其通过模板模式，使得继承类只需要简单实现几个方法，重点关注在 state 的获取和释放逻辑上，便可以很方便地去实现同步器和锁，比如 ReentrantLock、ReentrantReadWriteLock、CountDownLatch、Semaphore 等等。

## AQS 核心思想

AQS 的核心思想是通过一个共享变量 state 来模拟资源，线程争夺资源的实质是获得 state 的修改权。

在多线程的资源竞争过程中，对于暂时无法获得资源的线程，需要一套线程阻塞与唤醒的协调机制，而这个机制的基础就是 CLH 等待队列，AQS 将暂时获取不到资源的线程加入到队列之中。

![AQS-CLH](https://www.lin2j.tech/blog-image/thread/AQS-CLH.png)

## AQS 资源共享模式

- Exclusive(独占模式)：只有一条线程能持有锁资源，例如 ReentrantLock。根据独占模式的锁抢夺方式又可以分为公平锁和非公平锁。
  - 公平锁：抢夺锁时会先判断队列中是否有其他线程在执行或者等待，如果有则进入队列。
  - 非公平锁：抢夺锁时无视队列的排队顺序，先尝试抢夺锁资源，失败再进入队列。
- Shared(共享模式)：多个线程可以同时执行，例如 CountDownLatch。

一般来讲在实现同步器和锁的时候，只需要实现其中一种模式即可，但是也可以同时实现两种模式，例如 ReentrantReadWriteLock。

## AQS 的模板模式

AQS 是模板模式的一个经典应用，继承类只要根据需要去重写指定的几个方法，便可以获得自己的同步器，而重写的逻辑实际是聚焦于对 state 的获取和释放上。

这些方法默认实现都是抛出 UnsupportedOperationException 异常，所以开发者要重写需要的方法，而重写这些方法时，应当保证重写的逻辑是线程安全的、简单的、无阻塞的。

```java
// 独占模式，尝试获取资源，成功返回 true，失败返回 false
tryAcquire()
// 独占模式，尝试释放资源，成功返回 true，失败返回 false
tryRelease()
// 共享模式，尝试获取资源，成功返回 true，失败返回 false
tryAcquireShared()
// 共享模式，尝试释放资源，成功返回 true，失败返回 false
tryReleaseShared()
// 当前线程是否独占资源，只有在使用 Condition 的时候才会用到
isHeldExclusively()
```

# AQS 使用示例

在继承 AQS 实现自己的锁时，通常是将继承类作为一个内部类 Sync，之后该内部类作为外部类的一个成员变量去操作。

下面是通过 AQS 实现一个简单的不可重入的锁 SimpleLock（state 为 0 代表没有加锁，state 非 0 代表已经加锁），并实现了公平锁和非公平锁的抢夺方式。

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.AbstractQueuedSynchronizer;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;

public class AbstractQueuedSynchronizerExample {

    private static int count = 0;

    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(5);

        SimpleLock lock = new SimpleLock();
        for (int i = 0; i < 10; i++) {
            executor.submit(() -> {
                lock.lock();
                try {
                    // 公平锁和非公平锁，打印的线程名顺序是不同的
                    // 公平锁的线程名会是 1、2、3、4、5 这样子按顺序打出来
                    // 非公平锁则是乱序的
                    System.out.println(Thread.currentThread().getName() + ": " + count);
                    count++;
                } finally {
                    lock.unlock();
                }
            });
        }

        executor.shutdown();
    }

}

class SimpleLock implements Lock {

    // Sync 作为 SimpleLock 的成员变量
    private Sync sync = new Sync();

    /**
     * 不可重入的同步器，实现的是公平锁
     *
     * 公平锁和非公平锁的实现差别在于，抢占锁之前有没有先判断
     * 同步队列里是否有其他线程在等待
     */
    private class Sync extends AbstractQueuedSynchronizer {

        /**
         * 请求获得锁，如果 state 为 0，则尝试获取
         * @return 成果获取资源返回 true，否则返回 false
         */
        @Override
        protected boolean tryAcquire(int ignore) {
            // 这是非公平锁实现
//            if (compareAndSetState(0, 1)) {
//                setExclusiveOwnerThread(Thread.currentThread());
//                return true;
//            }
//            return false;

            // 这是公平锁实现
            if (getState() == 0) {
                // 如果没有其他线程在等待，则尝试获取锁
                if (!hasQueuedPredecessors()
                        && compareAndSetState(0, 1)) {
                    // 设置当前占有锁的线程
                    setExclusiveOwnerThread(Thread.currentThread());
                    return true;
                }
            }
            return false;
        }

        /**
         * 释放锁，如果 state 为 0，则表明状态不对。
         * 将 state 设置为 0，
         *
         * @return 成功释放锁则返回 true
         */
        @Override
        protected boolean tryRelease(int ignore) {
            if (getState() == 0) {
                throw new IllegalMonitorStateException();
            }
            // 设置当前占有锁的线程为 null
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }

        Condition newCondition() {
            return new ConditionObject();
        }
    }
  
    // 实现 Lock 接口的方法

    @Override
    public void lock() {
        sync.acquire(1);
    }

    @Override
    public boolean tryLock() {
        return sync.tryAcquire(1);
    }

    @Override
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
        return sync.tryAcquireNanos(1, unit.toNanos(time));
    }

    @Override
    public void lockInterruptibly() throws InterruptedException {
        sync.acquireInterruptibly(1);
    }

    @Override
    public void unlock() {
        sync.release(1);
    }

    @Override
    public Condition newCondition() {
        return sync.newCondition();
    }
}
```

公平锁和非公平锁的输出内容可能有些不同，公平锁输出的线程名会是 1、2、3、4、5 这样子按顺序打出来，而非公平锁的则是乱序的。

| 公平锁输出                                                   | 非公平锁输出                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| pool-1-thread-1: 0<br/>pool-1-thread-2: 1<br/>pool-1-thread-3: 2<br/>pool-1-thread-4: 3<br/>pool-1-thread-5: 4<br/>pool-1-thread-1: 5<br/>pool-1-thread-2: 6<br/>pool-1-thread-3: 7<br/>pool-1-thread-4: 8<br/>pool-1-thread-5: 9 | pool-1-thread-1: 0<br/>pool-1-thread-4: 1<br/>pool-1-thread-5: 2<br/>pool-1-thread-5: 3<br/>pool-1-thread-5: 4<br/>pool-1-thread-5: 5<br/>pool-1-thread-5: 6<br/>pool-1-thread-2: 7<br/>pool-1-thread-3: 8<br/>pool-1-thread-4: 9 |

# AQS 代码详解

AQS 的实现过程考虑了很多功能，比如加锁解锁、超时等待、非阻塞的尝试加锁解锁、资源共享模式、条件等待、中断机制等，代码加注释有两千多行。下面通过加锁过程、解锁过程、中断机制三个方面，结合 ReentrantLock 来看一下 AQS 是如何运作的。

AQS 的方法有很多，详解过程中只会挑出一些关键方法进行解释，旨在了解其大概的运作原理。

*另外，代码详解没有涉及到条件等待的内容。*

![AQS](https://www.lin2j.tech/blog-image/thread/AQS.png)

## AQS 核心数据结构

CLH 队列作为协调线程阻塞与唤醒机制的基础数据结构，其节点对应的数据结构是内部类 Node。Node 类封装了线程，设置前驱、后继节点指针用于队列操作，同时设置了不同的节点状态 waitStatus 用于表示节点处于不同状态下。

```java
static final class Node {
    // 表明当前节点的线程处于共享模式
    static final Node SHARED = new Node();
    // 表明当前节点的线程处于独占模式
    static final Node EXCLUSIVE = null;

    // 节点状态值：表示节点内的线程被取消了
    static final int CANCELLED =  1;
    // 节点状态值：表示节点的后继节点需要被唤醒，即 unpark
    static final int SIGNAL    = -1;
    // 节点状态值：表示节点内的线程处于条件等待中
    static final int CONDITION = -2;
    // 节点状态值：表示节点内的线程在调用 acquireShared 时，
    //           需要无条件传播该节点状态至后方节点
    static final int PROPAGATE = -3;

    // 节点状态
    // 默认的值为 0，表示当前节点在队列中，等待获取锁
    volatile int waitStatus;

    // 前驱节点指针
    volatile Node prev;

    // 后继节点指针
    volatile Node next;

    // 节点封装的线程，在节点实例化时初始化，
    // 在节点作为头节点或者取消时置为 null
    volatile Thread thread;

    // 当节点处于条件队列中，该指针指向下一个等待节点
    // 或者用来表示当前节点的模式
    Node nextWaiter;

    // 节点是否是共享模式
    final boolean isShared() {
        return nextWaiter == SHARED;
    }

    // 返回该节点的前驱节点，如果前驱节点为 null，则抛出 NPE
    final Node predecessor() throws NullPointerException {
        Node p = prev;
        if (p == null)
            throw new NullPointerException();
        else
            return p;
    }

    Node() {    // Used to establish initial head or SHARED marker
    }

    Node(Thread thread, Node mode) {     // Used by addWaiter
        this.nextWaiter = mode;
        this.thread = thread;
    }

    Node(Thread thread, int waitStatus) { // Used by Condition
        this.waitStatus = waitStatus;
        this.thread = thread;
    }
}
```

## AQS 加锁过程

在 AQS 中，使用来 acquire 方法来做独占模式的加锁操作，它相当于 Lock 接口的 `lock()` 方法。它的内部调用了 `tryAcquire()` 方法，而该方法需要子类去重写，因此这里借助 ReentrantLock 来帮助理解整个完整的加锁过程。

下面先通过流程图简单了解 AQS 是如何通过 state 来进行加锁的。

![AQS-lock](https://www.lin2j.tech/blog-image/thread/AQS-lock.png)

ReentrantLock 实现了 Lock 接口，下面是其非公平锁的 `lock()` 方法的方法调用链，其中紫色的部分是 AQS 的加锁流程，绿色的是 ReentrantLock 的代码。

![AQS-acquire](https://www.lin2j.tech/blog-image/thread/AQS-acquire.png)



- 调用 ReentrantLock 的 `lock()` 方法进行加锁操作；
- ReentrantLock 调用内部类 Sync 的 `lock()` 方法，而 Sync 的 `lock()` 方法是抽象方法，需要子类去实现，在 ReentrantLock 实例化时选择公平锁和非公平锁。不管是公平锁还是非公平锁，最终都会调用 AQS 的 `acquire()` 方法； 
- AQS 的 `acquire()` 方法会调用 `tryAcquire()` 方法， `tryAcquire()` 需要子类自定义实现；
- `tryAcquire()` 是获取锁的方法，如果失败了，则会执行 AQS 定义好的等待逻辑。

### 加锁 acquire

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

acquire 方法比较简短，描述了大概的加锁过程。

1. AQS 先调用 tryAcquire 尝试获取锁；
2. 失败之后调用 addWaiter 将线程以独占模式加入到同步队列中；
3. 然后调用 acquireQueued 不断的获取锁资源，直到获取锁成功。
4. 获取锁的过程中如果被中断，则调用 selfInterrupt 自我中断。

### 入队 addWaiter

```java
private Node addWaiter(Node mode) {
    // 将当前线程封装成 Node 节点
    Node node = new Node(Thread.currentThread(), mode);
    // 在队列已有数据的情况下，尝试直接将 node 作为队尾
    // 入队失败，再调用 enq 入队
    Node pred = tail;
    if (pred != null) { // 说明队列不为空，已经初始化过
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    // 说明队列还未初始化，或者 node 通过 CAS 作为队尾失败
    enq(node);
    return node;
}

// 采用无限循环，确保 node 能入队，并返回 node 的前驱节点
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        if (t == null) { // 队列中还没有元素，需要先初始化队列
            if (compareAndSetHead(new Node())) // 实例化一个哑节点作为头部，由此可见头节点时一个虚节点
                // tail 和 head 指向同一个节点
                tail = head;
        } else { // 队列已经有节点
            // 尝试将 node 设置为队尾
            node.prev = t;
            if (compareAndSetTail(t, node)) {
                t.next = node;
                return t;
            }
        }
    }
}
```

addWaiter 的作用是将线程以指定的模式封装成队列节点，入队之后将节点返回。在队列的初始化过程中，可以发现队列的头部其实一个虚节点，不会保存线程信息。

node 在入队时有一个细节需要特别注意，因为后面的代码会讲到 AQS 在遍历队列时，是**从尾到头**遍历的，这样能保证遍历到所有的节点。

> 从头到尾遍历是通过 next 指针，从尾到头则是通过 prev 指针

```java
// addWaiter 
Node pred = tail;
node.prev = pred;
if (compareAndSetTail(pred, node)) {
    pred.next = node;
  
// enq
Node t = tail;
node.prev = t;
if (compareAndSetTail(t, node)) {
    t.next = node; 	
```

不管是在 addWaiter 还是 enq，在 node 入队时，都是分三步进行的，先将 node 的 prev 指向 tail，然后尝试将 node 作为队尾，成功后再将原本 tail 的 next 指向 node。

这种入队方式之下，如果采用从头到尾遍历，可能会出现入队还处于第二步的情况时，少遍历一个节点的问题。（第二步时，线程 B 节点的 next 指针为 null）

![AQS-set-tail](https://www.lin2j.tech/blog-image/thread/AQS-set-tail.png)

### 获取与阻塞 acquireQueued

```java
final boolean acquireQueued(final Node node, int arg) {
    // 锁获取结果
    boolean failed = true;
    try {
        // 记录线程是否中断过
        boolean interrupted = false;
        // 自旋，直到获取锁成功或者中断
        for (;;) {
            // 拿到 node 的前驱节点
            final Node p = node.predecessor();
            if (p == head && tryAcquire(arg)) { // 如果 p 是头节点，则当前线程可以尝试获取锁
                // 获得锁成功后，将当前 node 作为头节点
                setHead(node);
                p.next = null; // help GC
                // 标记获取锁成功
                failed = false;
                return interrupted;
            }
            // 当前线程获取不到锁（可能在非公平方式下被其他线程抢占）或者 p 不是头节点
          
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())  // 判断当前线程是否需要阻塞，防止浪费资源
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}

// 设置头节点，并将 node 节点设置为虚节点
private void setHead(Node node) {
    head = node;
    node.thread = null;
    node.prev = null;
}

// 检查是否需要阻塞，只有当前一个节点的状态为 SIGNAL（-1）时，才会阻塞
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    // 获取前驱节点的状态
    int ws = pred.waitStatus;
    if (ws == Node.SIGNAL)
        // SINAL 可以保证前一个节点 release 是会唤醒下一个节点
        return true;
    if (ws > 0) {  // ws > 0 表示节点处于 CANCELLED 状态
        // 找到 prev 节点前面最近的一个状态不为 CANCELLED 状态的节点
        do {
            node.prev = pred = pred.prev;
        } while (pred.waitStatus > 0);
        pred.next = node;
    } else {
        // 设置前驱节点的状态为 SIGNAL
        // 这样在 node 下一次进入这个方法时，node 封装的线程会被阻塞
        compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
    }
    return false;
}

// 阻塞线程，在唤醒时返回线程的中断状态
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    // interrupted 方法会清除中断标记，所以
    return Thread.interrupted();
}
```

### 取消加锁 cancelAcquire

acquireQueued 通过自旋不断的去获取锁，而当获取锁失败时，需要执行取消加锁操作 cancelAcquire，将 node 标记为 CANCELLED，并将节点从同步队列中移除。取消的节点在移除过程中如果遇到竞争，那么不会做其他的操作，直接返回。

```java
private void cancelAcquire(Node node) {
    // node 为 null 则不处理
    if (node == null)
        return;
    // 清除 node 节点的线程信息
    node.thread = null;

    // 找到 node 前面最近的一个非 CANCELLED 节点
    // 也即将队列中 CANCELLED 节点移除
    Node pred = node.prev;
    while (pred.waitStatus > 0)
        node.prev = pred = pred.prev;

    // 获取pred结点的下一个结点
    Node predNext = pred.next;

    // 设置 node 节点的取消标志
    node.waitStatus = Node.CANCELLED;

    // 如果 node 是尾节点，那么直接将 node 移除，将 pred 设置为 tail
   	// pred.next 设置为 null
    if (node == tail && compareAndSetTail(node, pred)) {
        compareAndSetNext(pred, predNext, null);
    } else {
        // If successor needs signal, try to set pred's next-link
        // so it will get one. Otherwise wake it up to propagate.
        int ws;
        if (pred != head &&
            ((ws = pred.waitStatus) == Node.SIGNAL ||
             (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) &&
            pred.thread != null) { // pred 不是头节点，且（pred 的节点状态为 SIGNAL，或者 ws <= 0 时更新为 SIGNAL 成功）
                                   // 且 pred 节点的线程不为空
            // 如果 node 的后继节点不为空，且非取消节点，那么尝试将 next 作为 pred 的后继节点
            Node next = node.next;
            if (next != null && next.waitStatus <= 0)
                compareAndSetNext(pred, predNext, next);
        } else {
            // 如果当前节点是head的后继节点，或者上述条件不满足，那就唤醒当前节点的后继节点
            unparkSuccessor(node);
        }

        node.next = node; // help GC
    }
}
```

代码中，根据 pred 和 node 的位置关系，分三种情况去处理

![AQS-cancelAcquire](https://www.lin2j.tech/blog-image/thread/AQS-cancelAcquire.png)

## AQS 解锁过程

AQS 使用 release 方法来在独占模式下释放锁资源，它相当于 Lock 接口的 `unlock()` 方法。它的内部调用了 `tryRelease()` 方法，也是一个需要子类重写的方法。

下面先通过流程图简单了解 AQS 是如何释放 state 的。

![AQS-unlock](https://www.lin2j.tech/blog-image/thread/AQS-unlock.png)

ReentrantLock 实现了 Lock 接口，下面是其 `unlock()` 方法的方法调用链，其中紫色的部分是 AQS 的解锁流程，绿色的是 ReentrantLock 的代码。

![AQS-release](https://www.lin2j.tech/blog-image/thread/AQS-release.png)

- 调用 ReentrantLock 的 `unlock()` 方法进行资源释放；
- ReentrantLock 调用内部类 Sync 从 AQS 继承的 `release()` 方法；
- AQS 的 `release()` 方法会调用 Sync 重写的 `tryRelease()` 方法；
- `tryRelease()` 是释放资源的方法，成功释放后，则会执行 AQS 定义好的唤醒后续线程的逻辑 。

### 资源释放 release

```java
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

release 方法描述了大概的资源释放过程。

1. AQS 先调用 tryRelease 尝试释放资源；
2. 成功释放资源之后，找到队列的头节点，如果头节点不为空，则唤醒头节点之后的线程；
3. 最终返回 tryRelease 的结果。

### 线程的唤醒 unparkSucessor

```java
// 释放后继节点
private void unparkSuccessor(Node node) {
    // 获取 node 的节点状态
    int ws = node.waitStatus;
    if (ws < 0) // 状态值小于0，为SIGNAL -1 或 CONDITION -2 或 PROPAGATE -3
        // 将节点状态设置为 0
        compareAndSetWaitStatus(node, ws, 0);
   
    // 一般来讲，需要唤醒的线程存在于 node 的后继节点
    // 而如果后继节点被取消了，或者为空，那么就会从尾到 node 遍历寻找最后一个合适的节点进行唤醒
    Node s = node.next;
    if (s == null || s.waitStatus > 0) {  // s 为 null 或者处于 CANCELLED 状态
        s = null;
        // 从尾到 node 遍历（为什么不能从 node 到尾遍历，前面讲 addWaiter 时已经有解释了）
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null) // 节点存在则可以唤醒
        LockSupport.unpark(s.thread);
}
```

## AQS 中断处理

AQS 在获取锁的过程中，如果检测到线程已经发生中断，那么会有两种处理方式

- 响应中断，抛出 InterrupttedException 异常；
- 不响应中断，使用标记记录中断状态，并将中断状态作为方法结果返回。

这里主要讲一下使用标记记录中断状态的情况。

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}

static void selfInterrupt() {
    // 因为前面调用过 Thread.interrupted()，线程的中断标记被清除了
    // 所以这里需要把中断标记设为 true
    Thread.currentThread().interrupt();
}

final boolean acquireQueued(final Node node, int arg) {
...
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                // 记录中断
                interrupted = true;
...
}

private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    return Thread.interrupted(); // 检查中断
}
```

在这个过程中如果发生中断，AQS 采用记录中断方式，然后继续获取锁资源。这样用户可以选择在合适的时间去处理中断。

# 参考文章

- https://pdai.tech/md/java/thread/java-thread-x-lock-AbstractQueuedSynchronizer.html
- https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html
- https://gee.cs.oswego.edu/dl/papers/aqs.pdf
