import { searchPlugin } from '@vuepress/plugin-search'
import { mdEnhancePlugin } from 'vuepress-plugin-md-enhance'

import { defaultTheme } from 'vuepress'

import { getSideBar4Java } from './sidebar/java' 
import { getSideBar4Devops } from './sidebar/devops'
import { getSideBar4Middleware } from './sidebar/middleware'
import { getSideBar4Interview } from './sidebar/interview'

const description = "包含：Java 基础知识，Java 进阶知识，开发框架，设计模式，数据库，中间件，计算机网络，面试题，算法，部署工具..."

export default {
    // Byte Lab 该名称强调对计算机底层原理和字节级别操作的关注，并暗示了对技术的深入探索和实验的态度。
    title: 'Byte Lab',
    description: description,
    plugins: [
        searchPlugin({}),
        mdEnhancePlugin({
            katex: true
        })
    ],
    locales: {
        "/": {
            lang: "zh-CN",
            title: "Byte Lab",
            description: description
        }
    },
    markdown: {
        lineNumbers: true,
        externalLinks: {
            target: '_blank', rel: 'noopener noreferrer'
        },
    },
    head: [
        // ico
        ["link", {rel: "icon", href: `/favicon.svg`}],
        // meta
        ["meta", {name: "robots", content: "all"}],
        ["meta", {name: "author", content: "lin2j"}],
        ["meta", {"http-equiv": "Cache-Control", content: "no-cache, no-store, must-revalidate"}],
        ["meta", {"http-equiv": "Pragma", content: "no-cache"}],
        ["meta", {"http-equiv": "Expires", content: "0"}],
        ["meta", {name: "keywords", content: description}],
        ["meta", {name: "apple-mobile-web-app-capable", content: "yes"}]
    ],
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
                text: "面试",
                link: "/md/interview/MySQL.md",
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
            "/md/middleware/": getSideBar4Middleware(),
            "/md/interview": getSideBar4Interview()
        }
    })
}

