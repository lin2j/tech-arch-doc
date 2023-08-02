---
title: ThreadLocal 详解
---

# 简介



# 使用示例

```java

```

输出结果

```

```



# 源码详解

Semaphore 是基于 AQS 的共享模式实现的一个同步器，它的源码也和 CountDownLatch 相似，在 acquire 和 release 上，二者的区别在于重写的 tryAcquireShared 和 tryReleaseShared 方法上。

## 内部类 Sync

Semaphore 内部类 Sync 是实际的同步器，继承了 AQS，并基于 AQS 的共享模式实现了公平锁和非公平锁两种方式。

```java
abstract static class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 1192457210091910933L;
 
    // 将 AQS 的资源数作为许可证
    Sync(int permits) {
        setState(permits); // 设置资源数
    }
		
    // 获取现存的许可证
    final int getPermits() {
        return getState();
    }

    // 共享模式
    // 非公平方式获取资源实现
    // 返回值 ≥0 表示获取成功，<0 表示获取失败
    final int nonfairTryAcquireShared(int acquires) {
        // 不断尝试获取资源
        for (;;) {
            int available = getState();
            int remaining = available - acquires; // 资源数消耗
            if (remaining < 0 ||
                compareAndSetState(available, remaining)) // remaining < 0 表示没有资源了
                return remaining;
        }
    }

    // 共享模式
    // 释放资源，将当前资源数 current 加上 releases 数
    // 如果相加结果没有溢出，则尝试更新资源数
    protected final boolean tryReleaseShared(int releases) {
        for (;;) {
            int current = getState();
            int next = current + releases; // 资源数累加，可以看出资源数是可以大于初始资源数的
            if (next < current) // 溢出
                throw new Error("Maximum permit count exceeded");
            if (compareAndSetState(current, next)) // 尝试更新
                return true;
        }
    }

    // 减少 reductions 个许可证
    final void reducePermits(int reductions) {
        for (;;) {
            int current = getState();
            int next = current - reductions;
            if (next > current) // underflow
                throw new Error("Permit count underflow");
            if (compareAndSetState(current, next))
                return;
        }
    }

    // 将许可证清零
    final int drainPermits() {
        for (;;) {
            int current = getState();
            if (current == 0 || compareAndSetState(current, 0))
                return current;
        }
    }
}

/**
 * NonFair version
 */
static final class NonfairSync extends Sync {
    private static final long serialVersionUID = -2694183684443567898L;

    NonfairSync(int permits) {
        super(permits);
    }

    protected int tryAcquireShared(int acquires) {
        return nonfairTryAcquireShared(acquires);
    }
}

/**
 * Fair version
 */
static final class FairSync extends Sync {
    private static final long serialVersionUID = 2014338818796000944L;

    FairSync(int permits) {
        super(permits);
    }

    // 公平方式获取
    protected int tryAcquireShared(int acquires) {
        for (;;) {
            if (hasQueuedPredecessors()) // 先判断同步队列是否有其他线程在等待获取资源
                return -1;
            // 获取资源
            int available = getState();
            int remaining = available - acquires;
            if (remaining < 0 ||
                compareAndSetState(available, remaining))
                return remaining;
        }
    }
}
```

## 属性

Semaphore 只有一个 Sync 成员变量

```java
public class Semaphore {
    // 同步队列
    private final Sync sync;
}
```

## 构造函数

Semaphore 有两个构造函数，用于接收初始的资源数以及采用何种方式（公平、非公平）方式获取资源。

```java
public Semaphore(int permits) {
    // 默认采用非公平的方式获取资源
    sync = new NonfairSync(permits);
}

public Semaphore(int permits, boolean fair) {
    // 根据 fair 决定从用何种方式获取资源
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
```

## 核心函数 acuqire

acquire 从 Semaphore 中获取一个或者多个许可，并且线程一直阻塞直到获取到许可，或者线程被中断。

```java
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}

public void acquire(int permits) throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireSharedInterruptibly(permits);
}
```

它的方法调用链和 [CountDownLatch 详解](https://www.lin2j.tech/md/java/thread/JUC%20工具类%20CountDownLatch%20详解.html) 那一篇的 await 方法一样，这里不再赘述。

## 核心函数 release

release 释放一个或者多个许可给 Semaphore。

```java
public void release() {
    sync.releaseShared(1);
}

public void release(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.releaseShared(permits);
}
```

它的方法调用链和 [CountDownLatch 详解](https://www.lin2j.tech/md/java/thread/JUC%20工具类%20CountDownLatch%20详解.html) 那一篇的 countDown 方法一样，这里不再赘述。

# 拓展

问： semaphore 初始化有 2 个令牌，一个线程调用 1 次 release 方法，然后一次性获取 3 个令牌，会获取到吗?

答：可以获取到， release 方法没有限制一定要在 acquire 方法之后才能调用。理论上可以 release 到 `Integer.MAX_VALUE` 个令牌。下面用代码来测试 release 在 acquire 还没有调用的情况下，依然可以释放令牌，并且会增加令牌数。

测试代码：

```java
import java.util.concurrent.Semaphore;

public class SemaphoreReleaseExample {

    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(2);
        System.out.println("当前拥有 " + semaphore.availablePermits() + " 个许可证");
        semaphore.release();
        System.out.println("调用一次 release 方法：");
        System.out.println("当前拥有 " + semaphore.availablePermits() + " 个许可证");
    }
}
```

输出结果：

```
当前拥有 2 个许可证
调用一次 release 方法：
当前拥有 3 个许可证
```

# 参考文章

- https://pdai.tech/md/java/thread/java-thread-x-juc-tool-semaphore.html