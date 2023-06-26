module.exports = {
    title: 'Java 开发知识体系',
    description: 'xxxx',
    plugins: [
        '@vuepress/back-to-top',
        // 右侧工具栏
        // ['vuepress-plugin-toolbar',
        //     {
        //         "opts": [
        //             {
        //                 icon: "",
        //                 name: "文本展示",
        //                 popover: {
        //                     type: "text",
        //                     title: "纯文本说明",
        //                     text: "这是一个纯文本的内容展示，就是一段话"
        //                 }
        //             },
        //             {
        //                 icon: '',
        //                 name: 'html 支持',
        //                 popover: {
        //                     type: 'html',
        //                     title: '使用简单的 HTML 显示',
        //                     html: '<h1>使用简单的 HTML</h1> 进行展示 <a href="http://www.baidu.com"> 链接到百度 </a>'
        //                 }
        //             }
        //         ]
        //     },
        // ],
        // 右侧目录
        // [
        //     'vuepress-plugin-right-anchor', 
        //     {
        //         expand: {
        //             trigger: 'click'
        //         }
        //     }
        // ],


    ],
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        displayAllHeaders: true,
        nav: [
            { text: "首页", link: "/" },
            {
                text: "Java",
                items: [
                    { text: "Java 基础", 
                        items: [
                            {text: "反射", link: "/md/java/Java基础系列/反射" },
                            {text: "String为什么是不可变的", link: "/md/java/Java基础系列/String为什么是不可变的"}
                        ]
                    },
                    { text: "Java 进阶", 
                        items: [
                            {text: "垃圾收集器", link: "/md/java/jvm/垃圾收集器"}
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
            "/md/devops/": getSideBar4Devops()
        }
    }
}

function getSideBar4Java() {
    return [
        {
            title: "Java 基础",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "/md/java/Java基础系列/反射",
                "/md/java/Java基础系列/String为什么是不可变的",
            ]
        },
        {
            title: "Java 进阶", 
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "/md/java/JVM/垃圾收集器"
            ]
        }
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
