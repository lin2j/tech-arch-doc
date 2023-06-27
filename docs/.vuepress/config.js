import { backToTopPlugin } from '@vuepress/plugin-back-to-top'
import { searchPlugin } from '@vuepress/plugin-search'

import { defaultTheme } from 'vuepress'

import { getSideBar4Java } from './sidebar/java' 
import { getSideBar4Devops } from './sidebar/devops'
import { getSideBar4Middleware } from './sidebar/middleware'

export default {
    title: 'Java 开发知识体系',
    description: 'xxxx',
    plugins: [
        backToTopPlugin({}),
        searchPlugin({})
    ],
    markdown: {
        lineNumbers: true
    },
    theme: defaultTheme({
        displayAllHeaders: false,
        navbar: [
            { text: "首页", link: "/" },
            {
                text: "中间件",
                children: [
                    {
                        text: "消息中间件",
                        children: [
                            {text: "Kafka 系列", link: "/md/middleware/kafka/Kafka系列一消息队列.md"}
                        ]
                    }
                ]
            },
            {
                text: "工具｜部署",
                children: [
                    { 
                        text: "IntelliJ", 
                        children: [
                            {text: "实用插件推荐", link: "/md/devops/intellij/recommoned/禁用非必需插件，让 IDE 飞起.md"},
                            {text: "插件开发", link: "/md/devops/intellij/plugin/Simple Deployment.md"}
                        ]
                    },
                    {
                        text: "CI & CD",
                        children: [
                            {text: "Jenkins", link: "/md/devops/tool/Jenkins安装及自动部署.md"}
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
    })
}

