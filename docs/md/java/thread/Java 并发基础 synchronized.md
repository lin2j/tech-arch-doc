---
title: synchronized 详解
---

## 简介

synchronized 是 Java 并发编程中用来控制同步的关键字，可以用来锁住代码块或者方法。synchronized 可以搭配 Object 的 wait 和 notify 方法，来进行线程之间的阻塞和唤醒。

synchronized 实际上是对某个对象进行加锁解锁，在进入临界区（同步代码块）时，JVM 会尝试去获取锁，在离开临界区或者线程抛出异常后，会自动释放锁。此外，还可以使用 Object 的 wait 方法来手动释放锁并进入阻塞状态。

synchronized 在使用上同一个线程可以对同一个对象进行多次加锁，是一个可重入锁。

## 用法

synchronized 在使用上可以分为对象锁和类锁。对象锁的对象是某个对象，类锁的对象则是某个 Class 对象。

### 对象锁

#### 代码块

手动指定锁对象，可以是任意对象。

```java
import java.util.concurrent.TimeUnit;

public class SynchronizedObject {

    public static void main(String[] args) {
        Object lock = new Object();
        new Thread(() -> {
            synchronized (lock) {
                String thread = Thread.currentThread().getName();
                System.out.println(thread + "\t" + "获得锁");
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(thread + "\t" + "释放锁");
            }
        }, "AA").start();

        new Thread(() -> {
            synchronized (lock) {
                String thread = Thread.currentThread().getName();
                System.out.println(thread + "\t" + "获得锁");
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(thread + "\t" + "释放锁");
            }
        }, "BB").start();
    }
}
```

输出

```
AA	获得锁
AA	释放锁
BB	获得锁
BB	释放锁
```

上面的代码中，两个线程 AA 和 BB 都在争夺对象 lock，抢到锁之后的线程会休眠 1 秒，期间另一条线程只能等待直到获得锁。

#### 方法

在方法上加上 synchronized 关键字，该方法就会变成一个同步方法，线程之间争夺的锁对象就是 this。

```java
import java.util.concurrent.TimeUnit;

public class SynchronizedMethod {

    private static class MyObject {
        public synchronized void syncMethod() {
            String thread = Thread.currentThread().getName();
            System.out.println(thread + "\t" + "获得锁");
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(thread + "\t" + "释放锁");
        }
    }

    public static void main(String[] args) {
        final MyObject obj = new MyObject();

        new Thread(() -> {
            obj.syncMethod();
        }, "AA").start();

        new Thread(() -> {
            obj.syncMethod();
        }, "BB").start();
    }
}
```

输出

```
AA	获得锁
AA	释放锁
BB	获得锁
BB	释放锁
```

上面的代码中，两个线程  AA 和 BB 都会去执行 obj 的 syncMethod 方法，但是因为 syncMethod 添加了 synchronized 修饰，所以进入方法之前线程需要先去获取 obj 对象锁，成功获取的才能执行，否则只能等待。

### 类锁

#### Class 对象

手动指定锁对象为 Class 对象。

```java
import java.util.concurrent.TimeUnit;

public class SynchronizedClass {

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (SynchronizedClass.class) {
                String thread = Thread.currentThread().getName();
                System.out.println(thread + "\t" + "获得锁");
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(thread + "\t" + "释放锁");
            }
        }, "AA").start();

        new Thread(() -> {
            synchronized (SynchronizedClass.class) {
                String thread = Thread.currentThread().getName();
                System.out.println(thread + "\t" + "获得锁");
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(thread + "\t" + "释放锁");
            }
        }, "BB").start();
    }
}
```

输出

```
AA	获得锁
AA	释放锁
BB	获得锁
BB	释放锁
```

上面的代码中，两个线程 AA 和 BB 都在争夺 SynchronizedClass 的 Class 对象，抢到锁之后的线程会休眠 1 秒，期间另一条线程只能等待直到获得锁。

#### 静态方法

```java
import java.util.concurrent.TimeUnit;

public class SynchronizedStaticMethod {
    public static synchronized void staticSyncMethod() {
        String thread = Thread.currentThread().getName();
        System.out.println(thread + "\t" + "获得锁");
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(thread + "\t" + "释放锁");
    }

    public static void main(String[] args) {

        new Thread(() -> {
            staticSyncMethod();
        }, "AA").start();

        new Thread(() -> {
            staticSyncMethod();
        }, "BB").start();
    }
}
```

上面的代码中，两个线程  AA 和 BB 都会去执行 staticSyncMethod 静态方法（方法是属于 SynchronizedStaticMethod 类的），但是因为 staticSyncMethod 添加了 synchronized 修饰，所以进入方法之前线程需要先去获取 SynchronizedStaticMethod 的 Class 对象，成功获取的才能执行，否则只能等待。

## 底层原理

synchronized 有两种形式加锁，一个是对方法加锁，一个是对同步代码块加锁。但是它们的底层实现其实都一样，只是它们的识别方式有所不同，从 class 字节码文件可以表现出来，一个是通过方法标志，一个是 monitorenter 和 monitorexit 指令操作。

下面通过代码用看一下这些标志和指令。

```java
public class SynchronizedPrinciple {
    public synchronized void syncMethod() {
    }

    public static void main(String[] args) {
        synchronized (args) {

        }
    }
}
```

上述代码先通过 javac SynchronizedPrinciple.java 获得字节码文件，然后再通过 javap -verbose SynchronizedPrinciple 命令查看详细的字节码文件信息。

*因为字节码信息比较长，这里只截取需要的部分*

```java
  public synchronized void syncMethod();
    descriptor: ()V
    flags: (0x0021) ACC_PUBLIC, ACC_SYNCHRONIZED
    Code:
      stack=0, locals=1, args_size=1
         0: return
      LineNumberTable:
        line 9: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       1     0  this   Lcom/jia/blogdemo/thread/basic/SynchronizedPrinciple;

  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: (0x0009) ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=3, args_size=1
         0: aload_0
         1: dup
         2: astore_1
         3: monitorenter
         4: aload_1
         5: monitorexit
         6: goto          14
         9: astore_2
        10: aload_1
        11: monitorexit
        12: aload_2
        13: athrow
        14: return
      Exception table:
         from    to  target type
             4     6     9   any
             9    12     9   any
```

上面分别是 syncMethod 方法和 main 方法的字节码信息。从字节码信息中，我们需要关注两个点，方法的 flags 和方法的指令 Code。

首先，可以看到 syncMethod 的方法上的 flags 中有 ACC_SYNCHRONIZED 标志，表示这个方法是同步方法；然后，可以看到 main 方法的 Code 中包含了 monitorenter 和 monitorexit 指令，这两个指令分别对应着加锁和解锁两个操作。

实际上，Java 中每个对象都会有一个称为 monitor 的对象与之关联，当执行 monitorenter 指令时就是线程尝试去获取 monitor 所有权，当执行 monitorexit 指令则是释放 monitor 的所有权，执行 monitorenter 和 monitorexit 指令时 monitor 的计数器会进行加 $1$ 和减 $1$。一旦 monitor 的计数不为 $0$，就说明已经有线程获得该 monitor 了，而一个 monitor 在同一时间只能由一个线程获得。

在 monitor 中，还会去记录获得锁的线程，当已经获得锁的线程再次尝试获取同一个 monitor 时，计数器会加 $1$，因此 synchronized 是一个可重入的锁。

推荐文章：[Minitor 对象是什么](https://zhuanlan.zhihu.com/p/356010805)

![synchronized-monitor](https://www.lin2j.tech/blog-image/thread/synchronized-monitor.png)

## 优化

在 JDK 1.6 之前，synchronized 的性能比较低，因为 synchronized 是依赖操作系统的 Mutex Lock 来实现，而互斥锁的调用需要 CPU 从用户态转换到内核态来执行，某些情况下这种切换代价会比较高，因此这种需要依赖操作系统的 Mutex Lock 的实现被称为 “重量级锁”。（JUC 包是在 1.5 引入的，因此 JDK 1.6 之前使用 Lock 需要的代价更小）

而在 JDK 1.6 中，synchronized 做了很多优化来减少锁操作的开销。这些操作有：锁消除、锁粗化、自旋锁、适应性自旋锁、锁膨胀（偏向锁、轻量级锁）等。

#### 锁消除

锁消除是发生在编译器级别的一种方式，编译器在通过分析之后，发现共享数据不存在锁竞争却加了锁操作，那么就将锁操作消除，这样可以减少无意义的锁操作开销。

#### 锁粗化

原则上，我们推荐写同步代码块的时候，范围尽量缩小一些，在共享数据的实际作用区域才去做同步。这样可以提高线程的有效并发，如果存在锁竞争，等待线程也可以尽快拿到锁。

但是上述原则是建立在不同锁对象之上，如果一连串的锁操作都是针对同一个锁对象，那么会带来不必要的开销。如果JVM检测到有一连串零碎的操作都是对同一对象的加锁，将会扩大加锁同步的范围（即锁粗化）。

> 比如在循环体内重复对同一个对象返回加解锁，那么会将加解锁的范围扩大到循环体之外。

#### 自旋锁

线程从运行态到阻塞态的这个过程是比较耗时的，因为这个过程需要 CPU 从用户态转为内核态，还要保存线程的上下文信息。如果某条线程在此刻获取不到锁而阻塞，但是下一刻锁又被释放了，那么对于这条线程来说，本来只需要再等待一会儿（自旋）就能避免阻塞，也能顺利拿到锁。

自旋锁就是如果此刻线程拿不到锁，那么先不进入阻塞状态，而是在循环中去尝试继续获取锁。在这个过程中，线程依然会占用 CPU 资源，因此不可能通过无限循环去白白消耗 CPU 资源。在 Java 中，可以通过 -XX:PreBlockSpin 参数去指定循环次数，默认是 10 次。

#### 适应性自旋锁

上面讲的自旋锁，它是通过参数去指定循环次数的，也就是说 JVM 启动之后这个次数是固定的。那么如果一个锁恰巧是在线程自旋完之后的下一刻刚好被释放了，那么该线程也会进入阻塞状态。或者说某个锁经常被长时间占用，别的线程很难通过自旋的方式去获得。对于这两种情况，普通的自旋锁处理起来并不方便，因此出现了适应性自旋锁。

适应性自旋锁的适应性体现在，JVM 会分析某个锁的上一个持有线程以及自旋的时间来决定其他线程获取该锁时的自旋时间。如果该锁经常通过自旋可以拿到，那么 JVM 会愿意让其他线程在这个锁上花费多一些循环；而如果该锁很少或者从来没有通过自旋获得，那么可能会减少循环次数，甚至直接让线程进入阻塞。

适应性自旋锁就是 JVM 对锁状态的动态预测，以减少 CPU 的资源浪费。 

#### 锁膨胀

在 JDK 1.6 之前，synchronized 的锁状态只有无锁和重量级锁两种状态，JDK 1.6 中在这两种状态上加了两种，分别是偏向锁和轻量级锁。这四种状态的升级顺序是：无锁 -> 偏向锁 -> 轻量级锁 -> 重量级锁，而且整个过程是不可逆的。增加多两种状态的目的是为了避免 synchronized 过早使用 Mutex Lock 进行锁操作，而是通过其他的代价更小的方式进行锁操作。

在讲锁升级之前，需要简单了解一下 Java 的对象头中的 Mark Word，锁升级的过程需要通过修改 Java 对象头中的 Mark Word，主要是修改锁标志位和偏向锁持有线程。下面是一个 32 位的 Java 对象头的 Mark Word 示意。

```ruby
|-------------------------------------------------------|--------------------|
|                  Mark Word (32 bits)                  |       State        |
|-------------------------------------------------------|--------------------|
| identity_hashcode:25 | age:4 | biased_lock:1 | lock:2 |       Normal       |
|-------------------------------------------------------|--------------------|
|  thread:23 | epoch:2 | age:4 | biased_lock:1 | lock:2 |       Biased       |
|-------------------------------------------------------|--------------------|
|               ptr_to_lock_record:30          | lock:2 | Lightweight Locked |
|-------------------------------------------------------|--------------------|
|               ptr_to_heavyweight_monitor:30  | lock:2 | Heavyweight Locked |
|-------------------------------------------------------|--------------------|
|                                              | lock:2 |    Marked for GC   |
|-------------------------------------------------------|--------------------|
```

**lock**:  一个 2 bit 的锁状态标记位，该标记的值不同，整个mark word表示的含义不同。

**biased_lock**：对象是否启用偏向锁标记，只占1个二进制位。为1时表示对象启用偏向锁，为0时表示对象没有偏向锁。

**age**：4位的Java对象年龄。

**identity_hashcode**：25位的对象标识 hash 码。

**thread**：持有偏向锁的线程ID。

**epoch**：偏向时间戳。

**ptr_to_lock_record**：指向栈中锁记录的指针。

**ptr_to_heavyweight_monitor**：指向管程Monitor的指针。

其中不同的 biased_lock 和 lock 组合起来代表不同的锁状态。为了方便叙述，后面会使用 1|01 的方式来表示偏向锁标志。

| biased_lock | lock |   状态   |
| :---------: | :--: | :------: |
|      0      |  01  |   无锁   |
|      1      |  01  |  偏向锁  |
|      0      |  00  | 轻量级锁 |
|      0      |  10  | 重量级锁 |
|      0      |  11  |  GC标记  |

##### 偏向锁

偏向锁是第一种加锁状态，状态标记为 1|01 。虚拟机的开发人员发现在大多数情况下，锁不仅不存在多线程竞争，很多时候都是一条线程在反复的加解锁。为了针对这种情况，开发人员在线程获取锁的时候，会通过 CAS 在对象头和栈帧中存储持有偏向锁的线程 ID，以后该线程在进入和退出同步块时不需要进行CAS操作来加锁和解锁，只需要简单的测试一下对象头的  Mark Word 里是否存储着指向当前线程的偏向锁。如果成功，表示线程已经获取到了锁。如果失败，则需要根据不同的情况去处理：

- 如果 biased_lock 标志还是 1，说明目前还是偏向锁，则通过 CAS 将对象头的偏向锁指向当前线程；
  - 如果 CAS 成功，那么将锁的标志重置为无锁状态 0|01，重新进行偏向锁的获取；
  - 如果 CAS 失败，说明发生了锁竞争，这时候需要进行偏向锁的撤销。
- 如果 biased_lock 标志为 0，说明锁已经膨胀为轻量级锁，需要通 CAS 竞争锁；（轻量级锁的锁竞争方式在下面讲）

关于偏向锁的撤销，因为偏向锁采用了一种发生锁竞争才会释放锁的机制（被动），所以当有其他线程竞争偏向锁的时候，持有偏向锁的线程才会释放。偏向锁的撤销，需要等待全局安全点，然后首先暂停拥有偏向锁的线程，判断锁对象是否处于被锁定状态，撤销偏向锁后恢复到未锁定（标志位为 0|01）或轻量级锁（标志位为 0|00）的状态。

##### 轻量级锁

轻量级锁是指当锁是偏向锁的时候，却被另外的线程所访问，此时偏向锁就会升级为轻量级锁，其他线程会通过自旋（关于自旋的介绍见文末）的形式尝试获取锁，线程不会阻塞，从而提高性能。

轻量级锁的获取主要由两种情况：
① 当关闭偏向锁功能时；
② 由于多个线程竞争偏向锁导致偏向锁升级为轻量级锁。

在线程执行同步块之前，JVM会先在当前线程的栈帧中创建一个名为锁记录( Lock Record )的空间，用于存储锁对象目前的 Mark Word 的拷贝 ( JVM 会将对象头中的 Mark Word 拷贝到锁记录中，官方称为 Displaced Mark Ward )。

如果这个更新操作失败，JVM会检查当前的Mark Word中是否存在指向当前线程的栈帧的指针，如果有，说明该锁已经被获取，可以直接调用。如果没有，则说明该锁被其他线程抢占了，如果有两条以上的线程竞争同一个锁，那轻量级锁就不再有效，直接膨胀为重量级锁，没有获得锁的线程会被阻塞。

轻量级解锁时，会使用原子的CAS操作将Displaced Mark Word替换回到对象头中，如果成功，则表示没有发生竞争关系。如果失败，表示当前锁存在竞争关系，锁就会膨胀成重量级锁。

## 拓展

### synchronized 和 Lock 的区别

1. 底层结构不同（所属层面  JVM   vs  API ）

  - synchronized 是关键字，属于 JVM 层面的锁。
  - Lock 是具体的类，属于 API 层面的锁。

2. 使用方法不同（手动释放和自动释放的区别）

  - synchronized 不需要手动释放锁，当 synchronized 代码执行完成以后，系统会自动让线程释放锁。
  - ReentrantLock 则需要用户去手动释放锁，如果没有主动释放锁，就有可能导致出现死锁现象。需要 lock 和 unlock 方法配合 try-finally 语句块来完成。

3. 等待是否可中断 （可否中断）

  - synchronized 不可中断，除非抛异常或者正常运行完成。
  - ReentrantLock可中断：
    -  设置超时方法 tryLock(long timeout, TimeUnit unit)。
    -  lockInterruptibly() 放代码块中，调用 interrupt() 方法可中断。

4. 加锁是否公平（公平锁和非公平锁）

  - Synchronized  是非公平锁。
  - ReentrantLock 两者都可以，默认非公平锁，构造方法可以传入 boolean 值，true 为公平锁，false为非公平锁。

5. 锁绑定多个条件（精确唤醒）

  - Synchronized 没有
  - ReentrantLock 用来实现分组唤醒需要唤醒的线程们，可以精确唤醒，而不是像 synchronized，要么随机唤醒一个线程，要么唤醒全部线程。

## 参考文章

- https://www.cnblogs.com/aspirant/p/11705068.html
- https://zhuanlan.zhihu.com/p/75880892
- https://juejin.cn/post/6844903600334831629
- https://pdai.tech/md/java/thread/java-thread-x-key-synchronized.html

- https://www.jianshu.com/p/3d38cba67f8b
