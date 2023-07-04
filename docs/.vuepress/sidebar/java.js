function __getSideBar4Java() {
    return [
        {
            text: "Java 基础知识",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Java 异常机制",
                    link: "/md/java/basic/Java 异常机制.md",
                    collapsible: false
                },
                {
                    text: "Java 反射机制",
                    link: "/md/java/basic/Java 反射.md",
                    collapsible: false
                },
                {
                    text: "Java 注解机制",
                    link: "/md/java/basic/Java 注解.md",
                    collapsible: false
                },
                {
                    text: "Java SPI 机制",
                    link: "/md/java/basic/Java SPI 机制.md",
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
                    text: "Java 线程池：基础知识",
                    link: "/md/java/thread/Java 线程池：基础知识.md",
                    collapsible: false
                },
                {
                    text: "Java 线程池：拒绝策略详解",
                    link: "/md/java/thread/Java 线程池：拒绝策略详解.md",
                    collapsible: false
                },
            ]
        },
        {
            text: "Java 并发 - 验证与思考",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "CAS与ABA问题",
                    link: "/md/java/thread/think/CAS与ABA问题.md",
                    collapsible: false
                },
                {
                    text: "volatile 关键字特性",
                    link: "/md/java/thread/think/volatile 关键字特性的验证及思考.md",
                    collapsible: false
                },
                {
                    text: "synchronized 和 ReentrantLock 的区别",
                    link: "/md/java/thread/think/浅谈synchronized和ReentrantLock的区别.md",
                    collapsible: false
                },
                {
                    text: "线程安全的集合类哪里找",
                    link: "/md/java/thread/think/线程安全的集合类哪里找.md",
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
                    link: "/md/java/jvm/JVM 内存结构.md",
                    collapsible: false
                },
                {
                    text: "JVM 类加载机制",
                    link: "/md/java/jvm/JVM 类加载机制.md",
                    collapsible: false
                }
            ]
        }
    ]
}

export const getSideBar4Java = __getSideBar4Java
