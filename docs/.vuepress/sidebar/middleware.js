function __getSideBar4Middleware() {
    return [
        {
            text: "Kafka 系列",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Kafka 系列 - 消息队列",
                    link: "/md/middleware/kafka/Kafka系列一消息队列.html",
                    collapsible: false,
                },
                {
                    text: "Kafka 系列 - 消息队列的选择",
                    link: "/md/middleware/kafka/Kafka系列二消息队列的选择.html",
                    collapsible: false,
                },
                {
                    text: "Kafka 系列 - 基础概念",
                    link: "/md/middleware/kafka/Kafka系列三基础概念.html",
                    collapsible: false,
                },
                {
                    text: "Kafka 系列 - 生产者",
                    link: "/md/middleware/kafka/Kafka系列四生产者.html",
                    collapsible: false,
                },
                {
                    text: "Kafka 系列 - 消费者",
                    link: "/md/middleware/kafka/Kafka系列五消费者.html",
                    collapsible: false,
                },
            ]
        }
    ]
}

export const getSideBar4Middleware = __getSideBar4Middleware
