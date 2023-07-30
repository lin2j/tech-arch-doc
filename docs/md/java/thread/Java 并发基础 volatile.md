---
title: Java 并发基础 volatile
---

volatile 关键字是 Java 虚拟机提供的一种轻量级的同步机制。volatile 有保证可见性、禁止指令重排的作用，不保证原子性。

# volatile 特性验证

## 原子性验证

volatile 变量在简单的赋值和读取上是具有原子性的，但是在自增这种复合操作上是不具备原子性的，因为自增操作从字节码来说是分为三步的：

1. 数据加载；
2. 数据计算；
3. 数据赋值；

下面用代码来验证这一说法。

```java
public class VolatileAtomicVerify {
    // 原子类
    private static AtomicInteger a = new AtomicInteger(0);
    private static volatile int b = 0;

    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            for (int i = 0; i < 10000; i++) {
                a.getAndIncrement();
                b++;
            }
        }, "AA").start();

        new Thread(() -> {
            for (int i = 0; i < 10000; i++) {
                a.getAndIncrement();
                b++;
            }
        }, "BB").start();

        TimeUnit.SECONDS.sleep(1);

        System.out.println("a = " + a.get() + ", b = " + b);
        System.out.println("volatile 变量的自增操作" + (a.get() == b ? "" : "不") + "具备原子性");
    }

}
```

输出结果

```
a = 20000, b = 18289
volatile 变量的自增操作不具备原子性
```

代码中使用两个线程同时对 a、b 变量做自增操作，其中 a 是一个原子类，它的自增操作是保证原子性的，b 则只是一个用 volatile 修饰的变量。接下来两个线程同时对 a、b 变量做 10000 次自增操作。

如果 volatile 变量可以保证自增操作的原子性，那么最终 a 和 b 的结果应当是一致，但是从代码的运行结果来看，volatile 变量的自增操作不具备原子性。

## 可见性验证

```java
public class VolatileVisibleVerify {

    private static int a = 0;
    private static volatile int b = 0;

    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            System.out.println("AA 线程开始");
            while (a == 0) {}
            System.out.println("AA 线程结束");
        }, "AA").start();

        new Thread(() -> {
            System.out.println("BB 线程开始");
            while (b == 0) {}
            System.out.println("BB 线程结束");
        }, "BB").start();

        TimeUnit.SECONDS.sleep(1);

        a = 1;
        b = 1;
    }

}
```

输出结果

```
AA 线程开始
BB 线程开始
BB 线程结束
```

代码中两个线程中都有一个 while 循环去判断 a、b 变量的值，a、b 初始值都是 0。main 线程会在启动两条线程之后，睡眠一秒再去更改 a、b 的值为 1。

程序运行之后不会自动退出，因为线程 AA 感知不到变量 a 的变化，所以一直没有退出循环。而变量 b 因为用 volatile 修饰，因此 b 的改变对其他线程可见，因此线程 BB 可以感知到 b 的变化，从而退出循环。

## 防重排序解释

我们从一个最经典的例子来分析重排序问题。大家应该都很熟悉单例模式的实现，而在并发环境下的单例实现方式，我们通常可以采用双重检查加锁(DCL)的方式来实现。其源码如下：

```java
public class Singleton {
    public static volatile Singleton singleton;
    /**
     * 构造函数私有，禁止外部实例化
     */
    private Singleton() {};
  
    public static Singleton getInstance() {
        if (singleton == null) {
            synchronized (singleton.class) {
                if (singleton == null) {
                    singleton = new Singleton();
                }
            }
        }
        return singleton;
    }
}
```

现在我们分析一下为什么要在变量 singleton 之间加上 volatile 关键字。要理解这个问题，先要了解对象的构造过程，实例化一个对象其实可以分为三个步骤：

- 分配内存空间。
- 初始化对象。
- 将内存空间的地址赋值给对应的引用。

但是由于操作系统可以对指令进行重排序，所以上面的过程也可能会变成如下过程：

- 分配内存空间。
- 将内存空间的地址赋值给对应的引用。
- 初始化对象

如果是这个流程，多线程环境下就可能将一个未初始化的对象引用暴露出来，从而导致不可预料的结果。因此，为了防止这个过程的重排序，我们需要将变量设置为volatile类型的变量。

# 思考

对可见性验证的代码中，当取消了 volatile 关键字时，为什么 main 线程会一直感知不到变量的变化呢？

在 JMM(Java Memory Model) 的规范中，定义了线程访问共享变量的方式。线程在操作共享变量时，需要将变量从主存中拷贝到自己线程的工作内存中，然后对变量进行修改，修改后写回主存中。即 JMM 不允许直接操作主存中的变量。
![JMM共享变量读写](https://www.lin2j.tech/blog-image/think/JMM%E5%85%B1%E4%BA%AB%E5%8F%98%E9%87%8F%E8%AF%BB%E5%86%99.png)
回到这份测试代码中，线程GoGo 和 main 线程各持有一份num 变量的拷贝，在各自的线程中对变量进行修改，影响不到其他线程的变量。所以即使 GoGo 修改了自己工作内存中变量的值，main 线程中的 num 依旧是旧值，也就不会退出循环了。

当 main 线程刷新了工作内存后，是可以正常退出循环的。可是线程什么时候会刷新工作内存？

Doug Lea 大神在 [Concurrent Programming in Java](http://gee.cs.oswego.edu/dl/cpj/index.html) 一书中有下面一段话

```
In essence, releasing a lock forces a flush of all writes from working memory employed by the thread, 
and acquiring a lock forces a (re)load of the values of accessible fields. While lock actions provide 
exclusion only for the operations performed within a synchronized method or block, these memory effects 
are defined to cover all fields used by the thread performing the action.
```

谷歌翻译：

```
本质上，释放锁定会强制从线程使用的工作内存中清除所有写操作，而获取锁定会导致可访问字段的值（重新）加载。
虽然锁定操作仅对同步方法或块内执行的操作提供排除，但这些内存效果被定义为覆盖执行该操作的线程使用的所有字段。
```

因此，我将测试代码的逻辑修改了一下，发现可以正常退出了。

```java
/**
 * 资源类
 */
class ShareResource {
    volatile int num;
    AtomicInteger atomicNum = new AtomicInteger(0);

    public void addNum() {
        // num++ 是非原子操作
        this.num++;
    }

    public void addAtomicNum() {
        // 原子类的 ++ 操作是原子性的
        this.atomicNum.getAndIncrement();
    }
}

public class VolatileDemo {
    public static void main(String[] args) throws InterruptedException {
        testVisible();
    }

    /**
     * 验证 volatile 关键字的可见性
     */
    private static void testVisible() throws InterruptedException {
        ShareResource resource = new ShareResource();
        new Thread(() -> {
            // num 的初始值为 0，如果一直没有改变，这里将永远循环下去
            // 如果 volatile 可以保证变量在线程间的可见性，那么当其他
            // 线程修改之后，GoGo 线程可以感知到，并退出循环
            while (resource.num == 1024) {
                // do something
                // println 底层调用的方法是有用到 synchronized 关键字的，存在加锁解锁的过程
                // System.out.print("");
                // 或者直接使用 synchronized 关键字也行
                // synchronized (resource) {}
                // new File("a.txt");
            }
            System.out.println(Thread.currentThread().getName() + "\t stop");
        }, "GoGo").start();
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        resource.num = 2048;
        System.out.println(Thread.currentThread().getName() + " num add to 2048");
    }
}

```

网上还有一种说法是，发生 IO 操作时，也会刷新线程的工作内存。

如果要验证，可以将 System.out.println(); 换成 new File("a.txt"); 也是可以的。

所以目前可以得出的结论就是：**当发生IO 操作或者线程调用了 synchronized 修饰的方法或者代码块时，线程的工作内存会进行刷新。**

# 参考文章

- https://pdai.tech/md/java/thread/java-thread-x-key-volatile.html