# 拒绝策略

表示当线程池的全部线程都在工作，且任务队列已满时，对于新来的任务采取的处理方式。

JDK 内置有四种拒绝策略。

下面学习四种拒绝策略，先看源码然后验证。

### 验证代码

下面各个拒绝策略所使用的线程池的配置以及验证的代码逻辑基本相同，除了拒绝策略的选型。

使用的依赖有个谷歌的 `guava` 依赖，用来自定义一个 `ThreadFactory` 。

```xml
<!-- https://mvnrepository.com/artifact/com.google.guava/guava -->
<dependency>
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>20.0</version>
</dependency>
```

下面是源码，可以在看某个拒绝策略的时候，跑一遍，看看结果和我一不一样。

```java
import com.google.common.util.concurrent.ThreadFactoryBuilder;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 自己配置线程池，并比较四种拒绝策略的不同
 */
public class MyThreadPoolDemo {

        // 创建一个线程池，它最多有个 2 条线程在工作，然后队列的容量可以容纳最多3个任务
        ExecutorService service = new ThreadPoolExecutor(
                2,
                2,
                2L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(3),
                new ThreadFactoryBuilder().setNameFormat("policy-thread-%d").build(),
//                new ThreadPoolExecutor.DiscardPolicy()
//                new ThreadPoolExecutor.CallerRunsPolicy()
                new ThreadPoolExecutor.AbortPolicy()
//                new ThreadPoolExecutor.DiscardOldestPolicy()
        );

        // 这里假设有10个任务在很短的时间内相继到来
        for (int i = 0; i < 10; i++) {
//            try{ TimeUnit.SECONDS.sleep(2);}catch (InterruptedException e) {e.printStackTrace();}
            try {
                int finalI = i;
                service.execute(() -> {
                            System.out.println(Thread.currentThread().getName() + "\t 开始下载图片 " + finalI);
                            try {
                                TimeUnit.SECONDS.sleep(3);
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                            }
                            System.out.println(Thread.currentThread().getName() + "\t 下载图片完成 " + finalI);
                        }
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        service.shutdown();
    }

}
```

![perfect](https://www.lin2j.tech/blog-image/thread/perfect.jpg)

### `AbortPolicy` 

这是默认的拒绝策略。

`ThreadPoolExecutor` 有这样一句源码。

```java
    /**
     * The default rejected execution handler
     */
    private static final RejectedExecutionHandler defaultHandler =
        new AbortPolicy();
```

从 `AbortPolicy` 实现的 `rejectedExecution(Runable, ThreadPoolExecutor)` 方法可以看出，它是直接抛出异常的。

```java
public static class AbortPolicy implements RejectedExecutionHandler {
    public AbortPolicy() { }

    /**
     * 总是抛出 RejectedExecutionException
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        throw new RejectedExecutionException("Task " + r.toString() +
                                             " rejected from " +
                                             e.toString());
    }
}
```

下面是使用该拒绝策略时的运行结果。是否和你想的一样呢？

这里加上我对这个结果的思考。(截图中的  知道  应该是 直到，打错字了)	

![AbortPolicy](https://www.lin2j.tech/blog-image/thread/AbortPolicy.png)

### `CallerRunPolicy`

```java
/**
  * 线程池拒绝执行任务，并且直接将任务返回给调用了线程池的 execute 方法的线程。
  * 如果线程池已经关闭，那么任务不会返回给调用者。
  */
public static class CallerRunsPolicy implements RejectedExecutionHandler {
    public CallerRunsPolicy() { }

    /**
     * 在调用 execute 方法的线程执行任务。如果线程池已经关闭，那么就不执行任务。
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            r.run();
        }
    }
}
```

对于这个拒绝策略，其实每次运行的结果不一定相同。但是对于我们要证明的策略的表现，是没有影响的。

![CallerRunsPolicy](https://www.lin2j.tech/blog-image/thread/CallerRunsPolicy.png)

### `DiscardOldestPolicy`

```java
/**
  * 将队列中最早的的任务去掉，然后尝试执行 execute 方法，将新的任务放入线程池执行
  * 如果线程池已经关闭，那么任务就不再执行。
  */
public static class DiscardOldestPolicy implements RejectedExecutionHandler {
    public DiscardOldestPolicy() { }

    /**
      * 拿到队列中最新的未执行的任务，并直接丢弃掉。
      * 如果线程池已经关闭，那么任务就不再执行。
      */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            e.getQueue().poll();
            e.execute(r);
        }
    }
}
```

运行结果如下。

![DiscardOldestPolicy](https://www.lin2j.tech/blog-image/thread/DiscardOldestPolicy.png)
### `DiscardPolicy`

```java
/**
 * 将被拒绝的任务忽略掉，不执行也不报错
 */
public static class DiscardPolicy implements RejectedExecutionHandler {
    public DiscardPolicy() { }

    /**
     * 对于新来的任务什么也不做
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
    }
}
```

![DiscardPolicy](https://www.lin2j.tech/blog-image/thread/DiscardPolicy.png)



验证到此结束，整个过程并不复杂，主要是加深对拒绝策略的印象。

所有的拒绝策略都实现了接口 `java.util.concurrent.RejectedExecutionHandler` 的 `rejectedExecution(Runable, ThreadPoolExecutor)` 方法，如果想要自己实现一套拒绝策略，就自己实现这个接口。