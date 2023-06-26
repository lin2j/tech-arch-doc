死锁出现的原因

a. 系统资源不足

b. 进程的推进顺序不当

c. 资源分配不当

死锁指的是两个或者多个进程在执行过程中，因为资源争夺而导致互相等待资源释放，若无外力干涉它们无法继续推进下去的情况。

如果系统资源充足，那么进程的资源请求都能够得到满足，那么死锁出现的可能性就会降低，否则会因为争夺有限的资源而陷入死锁。

 ![dead-lock-示意图](https://www.lin2j.tech/upload/2021/08/dead-lock-%E7%A4%BA%E6%84%8F%E5%9B%BE-2e6acf41275c4ee79b6995499ad83053.png)

下面通过一个例子来演示这种资源争夺的情况。

```java

import java.util.concurrent.*;

class HoldLockThread implements Runnable {
    String lockA;
    String lockB;
    
    public HoldLockThread(String lockA, String lockB){
        this.lockA = lockA;
        this.lockB = lockB;
    }
    
    @Override
    public void run(){
        synchronized(lockA) {
            System.out.println(Thread.currentThread().getName() + "\t" + " hold lock " + lockA + " try lock " + lockB);
            try {
                // 休息一秒，让另一个线程有足够的时间获取另一个锁
                TimeUnit.SECONDS.sleep(1);
            } catch (Exception e) {
               e.printStackTrace();
            }
            synchronized(lockB) {
                System.out.println(Thread.currentThread().getName() + "\t" + " hold lock " + lockB);
            }
        }
    }
}

/**
 * 死锁 Demo
 * @author linjinjia
 * @date 2020-08-18 22:20
 */
public class DeadLockDemo {
    
    public static void main(String[] args){
        String l1 = "lock1";
        String l2 = "lock2";
        
        new Thread(new HoldLockThread(l1, l2), "D1").start();
        new Thread(new HoldLockThread(l2, l1), "D2").start();
    }
}
```

编译运行这个例子，可以发现程序无法正常退出。

 ![dead-lock-demo](https://www.lin2j.tech/upload/2021/08/dead-lock-demo-56ed1dfb35254488951284dccfe40c9a.png)

现在，使用 jps 命令查看当前 Java 进程的 id，然后借助 jstack 命令，来看一下有没有发生死锁

 ![dead-lock-demo-jps](https://www.lin2j.tech/upload/2021/08/dead-lock-demo-jps-459058a3b86641e3bc1cb5885b6f7879.png)

 ![jstack-dead-lock](https://www.lin2j.tech/upload/2021/08/jstack-dead-lock-378f369c6ccf4f2491300d9052b80f12.png)

可以看到 jstack 明确的指出程序中出现一个死锁，并说明哪个线程在等待哪些资源。