本文会简单对比一下 `synchronized` 关键字和 `Lock` 的区别，不会讲到底层原理。



**`synchronized` 和 `Lock` 有什么区别？使用Lock有什么好处，举例说明。**

1. 底层结构不同（所属层面 `JVM`  vs `API`）
  - `synchronized` 是关键字，属于 `JVM` 层面的。
    -  `monitorenter`（底层是通过 `monitor` 对象来完成，其实 `await` 和 `notify` 方法都依赖于 `monitor` 对象，`await` 和 `notify` 只能再同步块或者同步方法调用 ）
    - `monitorexit`
  - Lock` 是具体的类，属于 `API` 层面的锁。
2. 使用方法不同（**手动释放和自动释放的区别**）
  - `synchronized` 不需要手动释放锁，当 `synchronized` 代码执行完成以后，系统会自动让线程释放对所得占用。
  - `ReentrantLock` 则需要用户去手动释放锁，如果没有主动释放锁，就有可能导致出现死锁现象。需要 `lock() `和 `unlock()` 方法配合 `try/finally` 语句块来完成。
3. 等待是否可中断 （**可否中断**）
  - `synchronized` 不可中断，除非抛异常或者正常运行完成。
  - `ReentrantLock`可中断：
    -  设置超时方法 `tryLock(long timeout, TimeUnit unit)`。
    - `lockInterruptibly() `放代码块中，调用 `interrupt() `方法可中断。
4. 加锁是否公平（**公平锁和非公平锁**）
  - `Synchronized`  是非公平锁。
  - `ReentrantLock` **两者都可以**，默认非公平锁，构造方法可以传入 `boolean` 值，`true` 为公平锁，`false`为非公平锁。
5. 锁绑定多个条件（**精确唤醒**）
  - `Synchronized` 没有
  - `ReentrantLock` 用来实现分组唤醒需要唤醒的线程们，可以精确唤醒，而不是像 `synchronized`，要么随机唤醒一个线程，要么唤醒全部线程。`newCondition()` 方法。

    

`ReentrantLock` 多条件精确控制线程 Demo

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * @author linjinjia linjinjia047@163.com
 * @date 2021/3/30 21:38
 */
public class SyncAndReentrantLockDemo {
    public static void main(String[] args) {
        ShareResource shareResource = new ShareResource();

        new Thread(()->{
            for (int i = 0; i < 3; i++) {
                shareResource.print1();
            }
        }, "AA").start();
        new Thread(()->{
            for (int i = 0; i < 3; i++) {
                shareResource.print2();
            }
        }, "BB").start();
        new Thread(()->{
            for (int i = 0; i < 3; i++) {
                shareResource.print3();
            }
        }, "CC").start();
    }
}

/**
 * 多线程之间按照顺序调用，实现 A->B->C三个线程启动，要求如下：
 * AA 打印 1 次，BB 打印 2次，CC打印 3次
 * 来3轮
 */
class ShareResource {
    /**
     * flag = 1，线程AA启动
     * flag = 2，线程BB启动
     * flag = 3，线程CC启动
     */
    private int flag = 1;
    private Lock lock = new ReentrantLock();
    private Condition c1 = lock.newCondition();
    private Condition c2 = lock.newCondition();
    private Condition c3 = lock.newCondition();

    public void print1(){
        lock.lock();
        try{
            // 1. 判断
            while(flag != 1){
                c1.await();
            }
            // 2. 干活
            print(Thread.currentThread().getName(), 1);
            // 3. 通知
            flag = 2;
            c2.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public void print2(){
        lock.lock();
        try{
            // 1. 判断
            while(flag != 2){
                c2.await();
            }
            // 2. 干活
            print(Thread.currentThread().getName(), 2);
            // 3. 通知
            flag = 3;
            c3.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public void print3(){
        lock.lock();
        try{
            // 1. 判断
            while(flag != 3){
                c3.await();
            }
            // 2. 干活
            print(Thread.currentThread().getName(), 3);
            // 3. 通知
            flag = 1;
            c1.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    private void print(String name, int count){
        for(int i = 0; i < count; i++){
            System.out.println(name + "\t " + i);
        }
    }
}
```

输出

```
AA	 0
BB	 0
BB	 1
CC	 0
CC	 1
CC	 2
AA	 0
BB	 0
BB	 1
CC	 0
CC	 1
CC	 2
AA	 0
BB	 0
BB	 1
CC	 0
CC	 1
CC	 2
```
