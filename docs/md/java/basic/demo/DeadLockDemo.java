
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