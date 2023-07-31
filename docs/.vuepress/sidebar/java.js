function __getSideBar4Java() {
    return [
        {
            text: "Java 基础知识",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Java 泛型机制",
                    link: "/md/java/basic/Java 泛型.html",
                    collapsible: false
                },
                {
                    text: "Java 异常机制",
                    link: "/md/java/basic/Java 异常机制.html",
                    collapsible: false
                },
                {
                    text: "Java 反射机制",
                    link: "/md/java/basic/Java 反射.html",
                    collapsible: false
                },
                {
                    text: "Java 注解机制",
                    link: "/md/java/basic/Java 注解.html",
                    collapsible: false
                },
                {
                    text: "Java SPI 机制",
                    link: "/md/java/basic/Java SPI 机制.html",
                    collapsible: false
                }
            ]
        },
        {
            text: "Java 并发",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Java 线程基础",
                    link: "/md/java/thread/Java 并发 线程基础.html"
                },
                {
                    text: "Java 并发基础 CAS",
                    link: "/md/java/thread/Java 并发基础 CAS.html",
                    collapsible: false
                },
                {
                    text: "Java 并发基础 volatile",
                    link: "/md/java/thread/Java 并发基础 volatile.html",
                    collapsible: false
                },
                {
                    text: "线程池 Future & FutureTask 详解",
                    link: "/md/java/thread/Java 线程池 FutureTask 详解.html",
                    collapsible: false
                },
                {
                    text: "线程池 ThreadPoolExecutor 详解",
                    link: "/md/java/thread/Java 线程池 ThreadPoolExecutor 详解.html",
                    collapsible: false
                },
                {
                    text: "JUC 锁 LockSupport 详解",
                    link: "/md/java/thread/JUC 锁 LockSupport 详解.html",
                    collapsible: false
                },
                {
                    text: "JUC 锁 AQS 详解",
                    link: "/md/java/thread/JUC 锁 AQS 详解.html",
                    collapsible: false
                },
                {
                    text: "JUC 工具类 CountDownLatch 详解",
                    link: "/md/java/thread/JUC 工具类 CountDownLatch 详解.html",
                    collapsible: false
                },

            ]
        },
        {
            text: "Java 虚拟机",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "JVM 内存结构",
                    link: "/md/java/jvm/JVM 内存结构.html",
                    collapsible: false
                },
                {
                    text: "JVM 类加载机制",
                    link: "/md/java/jvm/JVM 类加载机制.html",
                    collapsible: false
                }
            ]
        }
    ]
}

export const getSideBar4Java = __getSideBar4Java
