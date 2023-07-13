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
                    text: "线程基础",
                    link: "/md/java/thread/Java 并发 线程基础.html"
                },
                {
                    text: "JUC 锁 LockSupport 详解",
                    link: "/md/java/thread/JUC 锁 LockSupport 详解.html",
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
                }
            ]
        },
        {
            text: "Java 并发 - 验证与思考",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "CAS与ABA问题",
                    link: "/md/java/thread/think/CAS与ABA问题.html",
                    collapsible: false
                },
                {
                    text: "volatile 关键字特性",
                    link: "/md/java/thread/think/volatile 关键字特性的验证及思考.html",
                    collapsible: false
                },
                {
                    text: "synchronized 和 ReentrantLock 的区别",
                    link: "/md/java/thread/think/浅谈synchronized和ReentrantLock的区别.html",
                    collapsible: false
                },
                {
                    text: "线程安全的集合类哪里找",
                    link: "/md/java/thread/think/线程安全的集合类哪里找.html",
                    collapsible: false
                }
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
