---
title: LockSupport 详解
---

# LockSupport 的作用

LockSupport 为线程和其他同步类提供了基本的阻塞原语。借助于 Unsafe 类的 API，LockSupport 提供了 park 操作用于阻塞线程，提供了 unpark 操作用于唤醒线程。

park / unpark 底层的原理是“二元信号量”，你可以把它想象成只有一个许可证的 Semaphore，只不过这个信号量在重复执行 unpark 的时候也不会再增加许可证，最多只有一个许可证。

# LockSupport 源码解析

## 核心属性

```java
private static final sun.misc.Unsafe UNSAFE;
// 下面是 Thread 类的成员变量的内存偏移量
private static final long parkBlockerOffset; 
private static final long SEED;
private static final long PROBE;
private static final long SECONDARY;
static {
    try {
        UNSAFE = sun.misc.Unsafe.getUnsafe();
        Class<?> tk = Thread.class;
        // 线程的阻塞者
        parkBlockerOffset = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("parkBlocker"));
        SEED = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("threadLocalRandomSeed"));
        PROBE = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("threadLocalRandomProbe"));
        SECONDARY = UNSAFE.objectFieldOffset
            (tk.getDeclaredField("threadLocalRandomSecondarySeed"));
    } catch (Exception ex) { throw new Error(ex); }
}
```

## 构造函数

```java
private LockSupport() {}
```

LockSupport 作为一个工具类是不能被实例化的，其提供的方法都是 static 的，可以通过类名直接调用。

## 核心函数

LockSupport 的核心函数主要是两种类型：park 和 unpark，而 park 是用来阻塞线程的，unpark 用于唤醒指定线程。

### unpark()

```java
/**
 * 该方法主要有三方面需要注意
 * 
 * 1. 如果指定的线程正在阻塞中，可以调用该方法进行唤醒；
 * 2. 如果指定的线程没有阻塞，那么该方法可以保证该线程下一次调用 park 是不会被阻塞
 * 3. 如果指定的线程还没有启动（没有调用 start 方法），则调用该方法不会有任何作用
 */
public static void unpark(Thread thread) {
    if (thread != null)
        UNSAFE.unpark(thread);
} 
```

### park()

不同于 unpark 只有一个方法，park 有了三种类型的方法：不做任何设置、可以设置 blocker、可以设置超时时间。 park 方法的源码不复杂，这里直接通过表格来对比各个方法的区别会容易理解一些。

| 方法                                     | 使用描述                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| park()                                   | 直接挂起当前线程                                             |
| park(Object blocker)                     | 挂起当前线程，并设置负责挂起当前线程的对象                   |
| parkNanos(Object blocker, long nanos)    | 挂起当前线程，并设置负责挂起当前线程的对象以及超时时间（相对时间） |
| parkUntil(Object blocker, long deadline) | 挂起当前线程，并设置负责挂起当前线程的对象以及超时时间（绝对时间） |
| parkNanos(long nanos)                    | 挂起当前线程，并设置超时时间（相对时间）                     |
| parkUntil(long deadline)                 | 挂起当前线程，并设置超时时间（绝对时间）                     |
| Object getBlocker(Thread t)              | 获取负责阻塞指定线程的对象，如果线程没有阻塞，则返回 null    |

对于调用了 park 方法而阻塞的线程，线程唤醒条件有以下几种：

1. 其他线程使用 unpark 方法唤醒了阻塞的线程；
2. 阻塞线程被中断；
3. 其他一些不合逻辑的原因导致异常醒来；
4. 设置的超时时间到了。

对于第三点，源码的注释表示推荐使用 while 循环来判断线程的阻塞条件，可能还需要增加对中断的判断。

```java
while (condition()) { 
    LockSupport.park(this);
}
```

# LockSupport 的使用

## 示例一：park 和 unpark 搭配使用

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

public class LockSupportExample {

    /**
     * 通过 unpark 唤醒另一条线程
     */
    private static class UnparkThread extends Thread {

        /**
         * 等待唤醒的目标线程
         */
        private Thread target;

        UnparkThread(Thread target) {
            this.target = target;
        }

        @Override
        public void run() {
            try {
                String threadName = currentThread().getName();
                System.out.println(threadName +  ": before unpark");
                // 睡眠，以保证 park 先执行
                TimeUnit.SECONDS.sleep(1);

                System.out.println(threadName +  ": target thread blocker info: " + LockSupport.getBlocker(target));
                LockSupport.unpark(target);
                System.out.println(threadName +  ": after unpark");
                // unpark 会将 target 的 blocker 置为 null
                // 这里睡眠 1 秒以保证 target 的 blocker 为 null
                TimeUnit.SECONDS.sleep(1);
                System.out.println(threadName +  ": target thread blocker info: " + LockSupport.getBlocker(target));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        UnparkThread upt = new UnparkThread(Thread.currentThread());
        upt.start();

        String threadName = Thread.currentThread().getName();
        System.out.println(threadName +  ": before park");
        LockSupport.park("blocker of main");
        System.out.println(threadName +  ": after park");
    }
}
```

运行结果：

```
Thread-0: before unpark
main: before park
Thread-0: target thread blocker info: blocker of main
Thread-0: after unpark
main: after park
Thread-0: target thread blocker info: null
```

第 $1$ 、$2$ 行的打印顺序可能有变化，但是不影响。

## 示例二：通过中断唤醒 park 的线程

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

public class LockSupportExample2 {

    /**
     * 通过中断唤醒另一条线程
     */
    private static class InterruptThread extends Thread {

        /**
         * 等待唤醒的目标线程
         */
        private Thread target;

        InterruptThread(Thread target) {
            this.target = target;
        }

        @Override
        public void run() {
            try {
                String threadName = currentThread().getName();
                System.out.println(threadName + ": before interrupt");
                // 睡眠，以保证 park 先执行
                TimeUnit.SECONDS.sleep(1);
                System.out.println(threadName +  ": target thread blocker info: " + LockSupport.getBlocker(target));
                // 线程中断，之后 main 线程会被唤醒
                target.interrupt();
                System.out.println(threadName + ": after interrupt");
                TimeUnit.SECONDS.sleep(1);
                System.out.println(threadName +  ": target thread blocker info: " + LockSupport.getBlocker(target));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        InterruptThread it = new InterruptThread(Thread.currentThread());
        it.start();

        String threadName = Thread.currentThread().getName();
        System.out.println(threadName +  ": before park");
        LockSupport.park("blocker of main");
        System.out.println(threadName +  ": after park");
    }
}

```

运行结果：

```
Thread-0: before interrupt
main: before park
Thread-0: target thread blocker info: blocker of main
Thread-0: after interrupt
main: after park
Thread-0: target thread blocker info: null
```

## 示例三：设置超时，自动唤醒 park 的线程

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

public class LockSupportExample3 {

    public static void main(String[] args) {
        String threadName = Thread.currentThread().getName();
        System.out.println(threadName +  ": before park");
        LockSupport.parkNanos("blocker of main", TimeUnit.SECONDS.toNanos(1));
        System.out.println(threadName +  ": after park");
    }
}
```

运行结果：

```
main: before park
main: after park
```

## 示例四：先 unpark 再 park，线程不会阻塞

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

public class LockSupportExample4 {

    /**
     * 先调用 unpark
     */
    private static class UnparkFirstThread extends Thread {

        /**
         * 等待唤醒的目标线程
         */
        private Thread target;

        UnparkFirstThread(Thread target) {
            this.target = target;
        }

        @Override
        public void run() {
            String threadName = currentThread().getName();
            System.out.println(threadName + ": before unpark");
            System.out.println(threadName +  ": target thread blocker info: " + LockSupport.getBlocker(target));
            LockSupport.unpark(target);
            System.out.println(threadName + ": after unpark");
            System.out.println(threadName +  ": target thread blocker info: " + LockSupport.getBlocker(target));
        }
    }

    public static void main(String[] args) throws InterruptedException {
        UnparkFirstThread upf = new UnparkFirstThread(Thread.currentThread());
        upf.start();

        // 睡眠，等待 upf 线程执行完，
        // 保证先对 main 线程执行 unpark 操作
        TimeUnit.SECONDS.sleep(1);

        String threadName = Thread.currentThread().getName();
        System.out.println(threadName +  ": before park");
        LockSupport.park("blocker of main");
        System.out.println(threadName +  ": after park");
    }
}	
```

运行结果：

```
Thread-0: before unpark
Thread-0: target thread blocker info: null
Thread-0: after unpark
Thread-0: target thread blocker info: null
main: before park
main: after park
```

## 示例五：park 不会释放锁资源

```java
import java.util.concurrent.locks.LockSupport;

public class LockSupportExample5 {

    /**
     * 锁获取
     */
    private static class LockThread extends Thread {

        /**
         * 等待唤醒的目标线程
         */
        private Thread target;

        LockThread(Thread target) {
            this.target = target;
        }

        @Override
        public void run() {
            // 请求获得锁
            synchronized (this) {
                System.out.println("before unpark");
                LockSupport.unpark(target);
                System.out.println("after unpark");
            }
        }
    }

    public static void main(String[] args) {

        LockThread lockThread = new LockThread(Thread.currentThread());
        // 将 lockThread 的 start 放在 synchronized 块中调用
        // 保证 lockThread 启动的时候，main 线程已经获得锁
        synchronized (lockThread) {
            lockThread.start();
            System.out.println("before park");
            LockSupport.park();
            System.out.println("after park");
        }
    }
}
```

运行结果：

```
before park
```

打印第 $1$ 行之后，程序不会继续进行下去，因为 main 线程 park 之后，没有释放 lockThread 锁，所以 LockThread 线程无法获得锁去调用 unpark 方法，从而无法继续执行程序。

# LockSupport.park() & Object.wait() 对比

如果通过 Object 的 `await()` 和 `notify()/notifyAll()` 阻塞唤醒线程，需要像下面这么做。

和 park、unpark 不同的是，unpark 调用后再调用 park ，线程是不会阻塞的，但是**如果先调用 notify 再调用 wait，则线程会一直阻塞。**

```java
import java.util.concurrent.TimeUnit;

/**
 * @author linjinjia
 * @date 2023/7/13 15:19
 */
public class ObjectAwaitExample {

    private static class NotifyThread extends Thread {
        @Override
        public void run() {
            synchronized (this) {
                String threadName = currentThread().getName();
                System.out.println(threadName + ": before notify");
                notify();
                System.out.println(threadName + ": after notify");
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        String threadName = Thread.currentThread().getName();
        // 先执行 wait 再执行 notify 才是正确顺序
        NotifyThread nt = new NotifyThread();
        nt.setName("nt");
        synchronized (nt) {
            nt.start();
            System.out.println(threadName + ": before wait");
            nt.wait();
            System.out.println(threadName + ": after wait");
        }

        // 分割线
        TimeUnit.SECONDS.sleep(1);
        System.out.println("==================================");

        // 如果先执行 notify 再调用 wait，则主线程会一直阻塞
        NotifyThread nt2 = new NotifyThread();
        nt2.setName("nt2");
        nt2.start();
        // main 线程睡眠 1 秒，以保证 nt2 线程执行完成
        // 保证 notify 已经执行完成
        TimeUnit.SECONDS.sleep(1);
        synchronized (nt2) {
            System.out.println(threadName + ": before wait");
            nt2.wait();
            System.out.println(threadName + ": after wait");
        }
    }
}
```

运行结果：

```
main: before wait
nt: before notify
nt: after notify
main: after wait
==================================
nt2: before notify
nt2: after notify
main: before wait
```

在 nt2 那部分测试中，`main: after wait` 不会被打印，因为 main 线程调用 wait 之后，没有其他线程调用 notify 去唤醒 main 线程了，因此程序无法继续执行。

## LockSupport.park() 和 Object.wait() 的区别

- wait 需要在 synchronized 中执行，而 park 可以在任何地方执行；
- wait 声明抛出 InterruptedException 异常，需要调用者处理或者抛出，而 park 没有声明抛出异常；
- wait 阻塞的线程，需要通过 notify 来唤醒，而 park 阻塞的线程除了 unpark ，还有其他的唤醒方式；
- wait - notify 二者的调用顺序不能互调，但是 park - unpark 的调用顺序可以互调；
- wait 会释放锁资源，而 park 不会释放锁资源。
