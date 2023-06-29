function __getSideBar4Java() {
    return [
        {
            text: "Java 基础知识",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Java 反射",
                    link: "/md/java/basic/Java 反射.md",
                    collapsible: false
                },
                {
                    text: "Java 注解",
                    link: "/md/java/basic/Java 注解.md",
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
