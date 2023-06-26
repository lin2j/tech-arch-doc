module.exports = {
    title: 'Java 开发知识体系',
    description: 'xxxx',
    plugins: {
        '@vuepress/back-to-top': {},
        // 右侧工具栏
        // 'vuepress-plugin-toolbar': {
        //     "opts": [
        //         {
        //             icon: "",
        //             name: "文本展示",
        //             popover: {
        //                 type: "text",
        //                 title: "纯文本说明",
        //                 text: "这是一个纯文本的内容展示，就是一段话"
        //             }
        //         },
        //         {
        //             icon: '',
        //             name: 'html 支持',
        //             popover: {
        //                 type: 'html',
        //                 title: '使用简单的 HTML 显示',
        //                 html: '<h1>使用简单的 HTML</h1> 进行展示 <a href="http://www.baidu.com"> 链接到百度 </a>'
        //             }
        //         }
        //     ]
        // },
        // 右侧目录
        // 'vuepress-plugin-right-anchor': {
        //     expand: {
        //         trigger: 'click'
        //     }
        // }
    },
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        displayAllHeaders: true,
        nav: [
            { text: "首页", link: "/" },
            {
                text: "中间件",
                items: [
                    {
                        text: "消息中间件",
                        items: [
                            {text: "Kafka 系列", link: "/md/middleware/kafka/Kafka系列一消息队列"}
                        ]
                    }
                ]
            },
            {
                text: "工具｜部署",
                items: [
                    { 
                        text: "IntelliJ", 
                        items: [
                            {text: "实用插件推荐", link: "/md/devops/intellij/recommoned/禁用非必需插件，让 IDE 飞起"},
                            {text: "插件开发", link: "/md/devops/intellij/plugin/Simple Deployment"}
                        ]
                    },
                    {
                        text: "CI & CD",
                        items: [
                            {text: "Jenkins", link: "/md/devops/tool/Jenkins安装及自动部署"}
                        ]
                    }
                ]
            }
        ],
        sidebar: {
            "/md/java/": getSideBar4Java(),
            "/md/devops/": getSideBar4Devops(),
            "/md/middleware/": getSideBar4Middleware()
        }
    }
}

function getSideBar4Java() {
    return [
    ]
}

function getSideBar4Devops() {
    return [
        {
            title: "IDEA 插件推荐",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "/md/devops/intellij/recommoned/禁用非必需插件，让 IDE 飞起",
                "/md/devops/intellij/recommoned/实用插件推荐 CodeGlance Pro",
                "/md/devops/intellij/recommoned/实用插件推荐 show comment",
                "/md/devops/intellij/recommoned/实用插件推荐 Key Promoter X",
            ]
        },
        {
            title: "IDEA 插件开发",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "/md/devops/intellij/plugin/Simple Deployment",
            ]
        },
        {
            title: "CI & CD",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "/md/devops/tool/Jenkins安装及自动部署"
            ]
        }
    ]
}

function getSideBar4Middleware() {
    return [
        {
            title: "Kafka 系列",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "/md/middleware/kafka/Kafka系列一消息队列",
                "/md/middleware/kafka/Kafka系列二消息队列的选择",
                "/md/middleware/kafka/Kafka系列三基础概念",
                "/md/middleware/kafka/Kafka系列四生产者",
                "/md/middleware/kafka/Kafka系列五消费者",
            ]
        }
    ]
}
