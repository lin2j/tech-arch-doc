`volatile` 关键字是` Java` 虚拟机提供的一种**轻量级的同步机制**。

`volatile` **有保证可见性、禁止指令重排的作用，不保证原子性。**

#### 验证是否保证原子性

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
```

验证过程。

```java
/**
 * @author linjinjia
 * @date 2021/3/7 15:44
 */
public class VolatileDemo {
    public static void main(String[] args) throws InterruptedException {
        testAtomic();
    }

    /**
     * 验证 volatile 关键字是否具有原子性
     **/
    private static void testAtomic() throws InterruptedException {
        int n = 20;
        CountDownLatch latch = new CountDownLatch(n);
        ShareResource resource = new ShareResource();
        // 开启20条线程，都同一个资源类的成员变量进行操作
        for (int i = 0; i < n; i++) {
            new Thread(() -> {
                try {
                    // 循环次数大一点，更能看到最终结果的差异
                    for (int j = 0; j < 1000; j++) {
                        resource.addNum();
                        resource.addAtomicNum();
                    }
                } finally {
                    latch.countDown();
                }
            }, String.valueOf(i)).start();
        }
        latch.await();
        System.out.println(Thread.currentThread().getName()
                + "\tnum=" + resource.num + "\tatomicNum=" + resource.atomicNum);
        System.out.println(resource.num == resource.atomicNum.get()
                ? "volatile 保证原子性" : "volatile 不保证原子性");
    }
}
```

输出

```
main	num=16126	atomicNum=20000
volatile 不保证原子性
```

#### 验证 volatile 的可见性

```java
/**
 * @author linjinjia
 * @date 2021/3/7 15:44
 */
public class VolatileDemo {
    public static void main(String[] args) {
        testVisible();
    }

    /**
     * 验证 volatile 关键字的可见性
     */
    private static void testVisible() {
        ShareResource resource = new ShareResource();
        // 线程将在3秒后，将 num 改为 1，然后打印更新消息并结束
        new Thread(()->{
            try {
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            resource.num = 1;
            System.out.println(Thread.currentThread().getName() + " num add to 1");
        }, "GoGo").start();
        
        // num 的初始值为 0，如果一直没有改变，这里将永远循环下去
        // 如果 volatile 可以保证变量在线程间的可见性，那么当其他
        // 线程修改之后，main 线程可以感知到，并退出循环
        while (resource.num == 0) {
            // do nothing
        }
        System.out.println(Thread.currentThread().getName() + " stop, num=" + resource.num);
    }
}
```

输出

```
GoGo num add to 1
main stop, num=1
```

**在验证可见性的时候，可以将 volatile 关键字去掉再测试一遍，看看程序有什么样的表现？**



通过上面的验证，可以更加清楚地体会到 `volatile` 的特性。

并且，程序中也使用了一种解决 `volatile` 不保证原子性的方法。

可以通过**使用原子类**来保证变量的原子性。

还有一种方法，也可以保证变量的原子性。

**使用 `synchronized` 关键字**，但是这种方法的开销太大。

当然，具体问题具体分析。`volatile` 只能用于变量，而 `synchronized` 则可以用在方法以及代码块，按需选择即可。而且 `jdk1.6` 提供了**锁升级**的策略，`synchronized` 的性能有所提升。

#### 思考

对可见性验证的代码中，当取消了 `volatile` 关键字时，**为什么 main 线程会一直感知不到变量的变化呢**？

在 `JMM(Java Memory Model)` 的规范中，定义了线程访问共享变量的方式。线程在操作共享变量时，需要将变量从主存中拷贝到自己线程的工作内存中，然后对变量进行修改，修改后写回主存中。即 **`JMM` 不允许直接操作主存中的变量。**
![JMM共享变量读写](https://www.lin2j.tech/blog-image/think/JMM%E5%85%B1%E4%BA%AB%E5%8F%98%E9%87%8F%E8%AF%BB%E5%86%99.png)
回到这份测试代码中，线程`GoGo` 和 `main` 线程各持有一份`num` 变量的拷贝，在各自的线程中对变量进行修改，影响不到其他线程的变量。所以即使 `GoGo` 修改了自己工作内存中变量的值，`main` 线程中的 `num` 依旧是旧值，也就不会退出循环了。



当 `main` 线程刷新了工作内存后，是可以正常退出循环的。可是**线程什么时候会刷新工作内存**？

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
 * @author linjinjia
 * @date 2021/3/7 15:44
 */
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

网上还有一种说法是，发生 `IO` 操作时，也会刷新线程的工作内存。

如果要验证，可以将 `System.out.println();` 换成 `new File("a.txt");` 也是可以的。

所以目前可以得出的结论就是：**当发生`IO` 操作或者线程调用了 `synchronized` 修饰的方法或者代码块时，线程的工作内存会进行刷新。**



以上就是对 `volatile` 关键字的特性进行的验证以及两个思考。

通过最后一个思考，可以知道，虽然`volatile` 不保证可见性。但是不保证不代表线程就一定不知道共享变量的变化，它可能需要一些触发条件去刷新线程的工作内存。