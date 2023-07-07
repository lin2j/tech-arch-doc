# 进程与线程

进程是内存中的一个应用程序，是操作系统的分配资源的基本单位。线程是进程中的一个任务，是任务调度和执行的基本单位。一个进程可以包含多个线程，而多个线程共享进程的资源，并且还有自己的上下文环境。

线程具有进程的许多特征，但是相对进程来说具有较小的资源消耗和管理开销，因此线程也被叫做轻量级进程。

为什么线程的开销比进程小？

- 线程的切换需要保存的状态信息比进程的状态信息少；
- 线程的通信方式简单，一般通过共享内存的方式；而进程是通过管道、消息队列、信号量等等；

## 线程的优先级

Java 中的线程优先级分为 $10$ 级，优先级越高的线程拥有更高的几率执行，因为线程的优先级只是提供了相对的调度顺序，具体还是要看操作系统的调度算法和策略影响。

Java 的最低优先级是 $1$ （Thread.MIN_PRIORITY），最高优先级是 $10$（Thread.MAX_PRIORITY），如果没有设置优先级，那么 Java 线程的默认优先级是 $5$ （Thread.NORM_PRIORITY）。

每个 Java 线程都应该设置优先级，通过 `java.lang.Thread#setPriority` 方法进行设置。

## 线程的分类

- 主线程：程序启动的时候，操作系统会创建一条线程，随即会运行一条线程，这条线程就叫主线程。它负责启动其他的线程，以及在最后执行各种关闭的操作。
- 子线程：程序中创建的其他线程。
- 守护线程：守护线程是后台为其他线程服务的线程，当所有的非守护线程都终止，守护线程也会自动终止。Java 的垃圾回收线程就是一条守护线程。

# 线程的创建方式

Java 中的线程创建方式有三种，分别是：

- 继承 Thread 类；
- 实现 Runnable 接口；
- 实现 Callable 接口，可以有返回值，以及抛出异常。

相比继承 Thread 类，实现 Runnable、Callable 接口最重还是要通过 Thread 来执行，可以说 Runnable、Callable 更像是一个任务。

另外，在 Java 中不允许多继承，所以通过实现接口的方式相对更加灵活，而且有时候直接继承整个 Thread 类会增大开销。

线程的启动时通过 `java.lang.Thread#start()` 方法，直接调用 `java.lang.Thread#run()` 方法并不会启动线程，这是这两个方法的区别。

```java
import java.util.concurrent.Callable;
import java.util.concurrent.FutureTask;

public class ThreadCreate {

    /**
     * 通过继承 Thread 创建线程
     */
    private static class MyThread extends Thread {
        @Override
        public void run() {
            System.out.println("MyThread");
        }
    }

    /**
     * 通过实现 Runnable 接口创建线程
     */
    private static class MyRunnable implements Runnable {

        @Override
        public void run() {
            System.out.println("MyRunnable");
        }
    }

    /**
     * 通过实现 Callable 接口创建线程
     */
    private static class MyCallable implements Callable<Integer> {

        /**
         * 可以有返回值，以及抛出异常
         */
        @Override
        public Integer call() throws Exception {
            System.out.println("MyCallable");
            return 100;
        }
    }

    public static void main(String[] args) {
        // 1. 继承 Thread，调用 start 方法
        MyThread mt =  new MyThread();
        mt.start();

        // 2. 实现 Runnable 接口，通过向 Thread 传入任务
        Thread tr = new Thread(new MyRunnable());
        tr.start();

        // 3. 实现 Callable 接口，通过向 Thread 传入任务
        // FutureTask 实际是实现了 Runnable 接口
        // 先将 Callable 作为内部成员，然后在 run 方法内去调用 call 方法
        FutureTask<Integer> task = new FutureTask<>(new MyCallable());
        Thread tc = new Thread(task);
        tc.start();
    }
}
```

# 线程的状态转换

![线程状态](https://www.lin2j.tech/blog-image/thread/%E7%BA%BF%E7%A8%8B%E7%8A%B6%E6%80%81.png)

## 新建（New）

创建了但是没有启动（调用 `start()` 方法）。

## 可运行（Runnable）

可能正在执行，也可能在等待 CPU 时间片。

包含了操作系统线程状态中的 Running 和 Ready。

## 阻塞（Blocked）

等待一个排他锁，如果获得锁就会结束此状态。

## 无限期等待（Waiting）

等待其他线程显示唤醒，不然不会分配 CPU 时间片

| 进入方法                                   | 退出方法                                |
| ------------------------------------------ | --------------------------------------- |
| 没有设置 Timeout 参数的 Object.wait() 方法 | Object.notify() 或者 Object.notifyAll() |
| 没有设置 Timeout 参数的 Thread.join() 方法 | 等待被调用的线程执行完毕                |
| LockSupport.park()                         | -                                       |

## 限期等待（Time Waiting）

无需等待其他线程显示唤醒，等待一定时间之后被系统自动唤醒。

阻塞和等待的区别在于阻塞是被动的，它在等待一个排他锁，而等待是主动的。

| 进入方法                                 | 退出方法                                        |
| ---------------------------------------- | ----------------------------------------------- |
| Thread.sleep() 方法                      | 时间结束                                        |
| 设置了 Timeout 参数的 Object.wait() 方法 | 时间结束 / Object.notify() / Object.notifyAll() |
| 设置了 Timeout 参数的 Thread.join() 方法 | 时间结束 / 被调用的线程执行完毕                 |
| LockSupport.parkNanos() 方法             | -                                               |
| LockSupport.parkUntil() 方法             | -                                               |

### 死亡(Terminated)

可以是线程结束任务之后自己结束，或者产生了异常而结束。

# 线程的中断

一条线程执行完任务可以自己自动结束，如果在执行任务的时候发生异常也会提前结束。

通常调用一个线程的 `interrupt()` 方法来中断该线程。但是 `interrupt()` 方法并不会马上让线程结束，而是改变线程的中断状态。

如果调用 `interrupt()` 方法时线程进入、退出阻塞状态，都会触发 InterruptedException 提前结束线程，否则需要用户自己去监测线程中断状态并做处理，

## InterruptedException

如果线程被  `Object.wait()` , ` Thread.join()` 和 `Thread.sleep()` 三种方法之一阻塞，此时调用该线程的 `interrupt()` 方法，那么该线程将抛出一个  InterruptedException 中断异常（该线程必须事先预备好处理此异常），从而提早地终结被阻塞状态。如果线程没有被阻塞，这时调用 `interrupt()` 将不起作用，直到执行到 `wait()`, `sleep()`, `join()` 时,才马上会抛出 InterruptedException。

## interrupted()

调用 `interrupt()` 方法会设置线程的中断标记，此时调用 `interrupted()` 方法会返回 true。因此可以在循环体中使用 `interrupted()` 方法来判断线程是否处于中断状态，从而提前结束线程。 `interrupted()` 方法会清除线程的中断状态，所以如果调用 `interrupt()`中断线程后，连续调用两次 `interrupted()`，第一次会返回 true，而第二次返回 false。

```java
public class ThreadInterrupt {

    /**
     * 监测线程中断标志
     */
    private static class WatchInterruptFlag extends Thread {
        @Override
        public void run() {
            while (!isInterrupted()) {
                System.out.println("di");
            }
            System.out.println("thread interrupted");
        }
    }

    /**
     * 线程阻塞引起 InterruptedException
     */
    private static class InterruptedExceptionTest extends Thread {

        @Override
        public void run() {
            try {
                // 只做阻塞动作
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        WatchInterruptFlag t = new WatchInterruptFlag();
        t.start();
        t.interrupt();

        // 分隔线
        TimeUnit.SECONDS.sleep(1);
        System.out.println("-----------");

        InterruptedExceptionTest ie = new InterruptedExceptionTest();
        // 1、2 处的代码可以运行看看触发 InterruptedException 的时间点
        // 在此处调用 interrupt 方法，ie 线程启动时会直接抛出 InterruptedException
        // ie.interrupt(); // 1
        ie.start();
        // 在此处调用 interrupt 方法，ie 线程启动时会在 sleep 唤醒之后抛出 InterruptedException
        ie.interrupt(); // 2
    }
}
```

# 线程的安全问题

线程安全是指某个方法或某段代码，在多线程中能够正确的执行，不会出现数据不一致或数据污染的情况，我们把这样的程序称之为线程安全的，反之则为非线程安全的。

在 Java 中，解决线程安全问题有以下 3 种手段：

- 互斥同步：一般是使用 JVM 自带 synchronized 或者 JDK 的 Lock；
- 非阻塞同步：使用 CAS 的乐观策略来达到无锁同步；
- 无同步
  - 栈封闭：多个线程访问方法的局部变量，不会出现线程安全，因为局部变量存储在虚拟机方法栈中，属于线程私有；
  - 线程本地存储：使用 ThreadLocal 使得对象在每个线程都有一个副本，避免操作同一个共享变量。

# 多线程的协作

当多个线程同时在处理某一个问题时，需要协调各个线程之间的工作，否则容易产生线程安全问题。

## join()

当线程调用另一个线程的 `join()` 方法时，会将当前线程阻塞，直到另一条线程完成。

```java
import java.util.concurrent.TimeUnit;

public class ThreadJoin {

    private static class A extends Thread {
        @Override
        public void run() {
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("A");
        }
    }

    private static class B extends Thread {
        private A a;

        public B(A a) {
            this.a = a;
        }

        @Override
        public void run() {
            try {
                System.out.println("B: before join");
                a.join();
                System.out.println("B: after join");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("B");
        }
    }

    public static void main(String[] args) {
        A a = new A();
        B b = new B(a);

        a.start();
        b.start();
    }
}
```

输出：

```java
B: before join
A
B: after join
B
```

## wait()、notify()/notifyAll()

调用 `wait()` 方法会使得当前线程阻塞起来，等待满足某一条件之后，其他线程调用 `notify()` 或者 `notifyAll()` 将当前线程唤醒。

`wait()`、`notify()`、`notifyAll()` 需要在 synchronzied 同步代码块之中使用，否则会抛出 IllegalMonitorStateException。这三个方法都是属于 Object 的，而不是 Thread。

`wait()` 方法会释放锁，避免其他线程获取不到锁的时候线程无法正常执行，无法通过 `notify()` 、`notifyAll()` 将阻塞的线程唤醒，造成死锁。（`sleep()` 方法则不会释放锁）

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.TimeUnit;

public class ThreadWait {

    /**
     * 缓存队列
     */
    private static final Queue<Integer> QUEUE = new LinkedList<>();

    /**
     * 缓冲队列的最大元素个数
     */
    private static final int MAX_COUNT = 5;

    /**
     * 生产者
     */
    private static class Producer extends Thread {
        private int idx = 0;

        @Override
        public void run() {
            while (!interrupted()) {
                synchronized (QUEUE) {
                    while (QUEUE.size() < MAX_COUNT) {
                        QUEUE.offer(idx++);
                    }
                    // 阻塞
                    try {
                        QUEUE.notify();
                        QUEUE.wait();
                    } catch (InterruptedException e) {
                        System.out.println("Producer interrupted");
                        return;
                    }
                }
            }
        }
    }

    /**
     * 消费者
     */
    private static class Consumer extends Thread {

        @Override
        public void run() {
            while (!interrupted()) {
                synchronized (QUEUE) {
                    try {
                        while (QUEUE.isEmpty()) {
                            QUEUE.notify();
                            QUEUE.wait();
                        }
                        while (!QUEUE.isEmpty()) {
                            // 控制打印速度
                            TimeUnit.MILLISECONDS.sleep(100);
                            System.out.println(QUEUE.poll());
                        }
                    } catch (InterruptedException e) {
                        System.out.println("Consumer interrupted");
                        return;
                    }
                }
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Producer producer = new Producer();
        Consumer consumer = new Consumer();

        producer.start();
        consumer.start();

        TimeUnit.SECONDS.sleep(10);

        producer.interrupt();
        consumer.interrupt();
    }
}

```

### await() signal() signalAll()

java.util.concurrent 类库中提供了 Condition 类来实现线程之间的协调，可以在 Condition 上调用 await() 方法使线程等待，其它线程调用 signal() 或 signalAll() 方法唤醒等待的线程。

相比于 wait() 这种等待方式，await() 可以指定等待的条件，因此更加灵活。

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class ThreadCondition {
    /**
     * 缓存队列
     */
    private static final Queue<Integer> QUEUE = new LinkedList<>();

    /**
     * 缓冲队列的最大元素个数
     */
    private static final int MAX_COUNT = 5;

    /**
     * 锁
     */
    private static ReentrantLock lock = new ReentrantLock();

    /**
     * 条件等待
     */
    private static Condition condition = lock.newCondition();

    /**
     * 生产者
     */
    private static class Producer extends Thread {
        private int idx = 0;

        @Override
        public void run() {
            while (!interrupted()) {
                lock.lock();

                try {
                    while (QUEUE.size() < MAX_COUNT) {
                        QUEUE.offer(idx++);
                    }
                    condition.signal();
                    condition.await();
                } catch (InterruptedException e) {
                    System.out.println("Producer interrupted");
                    return;
                } finally {
                    lock.unlock();
                }
            }
        }
    }

    /**
     * 消费者
     */
    private static class Consumer extends Thread {

        @Override
        public void run() {
            while (!interrupted()) {
                lock.lock();
                try {
                    while (QUEUE.isEmpty()) {
                        // 阻塞
                        condition.signal();
                        condition.await();
                    }

                    while (!QUEUE.isEmpty()) {
                        // 控制打印速度
                        TimeUnit.MILLISECONDS.sleep(100);
                        System.out.println(QUEUE.poll());
                    }
                } catch (InterruptedException e) {
                    System.out.println("Consumer interrupted");
                    return;
                } finally {
                    lock.unlock();
                }
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Producer producer = new Producer();
        Consumer consumer = new Consumer();

        producer.start();
        consumer.start();

        TimeUnit.SECONDS.sleep(10);

        producer.interrupt();
        consumer.interrupt();
    }
}
```

# 参考文章

- https://pdai.tech/md/java/thread/java-thread-x-thread-basic.html
- https://blog.csdn.net/jiadajing267/article/details/80590000