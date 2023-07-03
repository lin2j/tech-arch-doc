import {searchPlugin} from '@vuepress/plugin-search'
import {mdEnhancePlugin} from 'vuepress-plugin-md-enhance'
import {palettePlugin} from '@vuepress/plugin-palette'

import {defaultTheme} from 'vuepress'

import {getSideBar4Java} from './sidebar/java'
import {getSideBar4Devops} from './sidebar/devops'
import {getSideBar4Middleware} from './sidebar/middleware'
import {getSideBar4Interview} from './sidebar/interview'
import {getSidebar4Algorithm} from './sidebar/algorithm'
import {getSidebar4Project} from './sidebar/project'

const description = "包含：Java 基础知识，Java 进阶知识，开发框架，设计模式，数据库，中间件，计算机网络，面试题，算法，部署工具..."

export default {
    // Byte Lab 该名称强调对计算机底层原理和字节级别操作的关注，并暗示了对技术的深入探索和实验的态度。
    title: 'Byte Lab',
    description: description,
    plugins: [
        searchPlugin({}),
        mdEnhancePlugin({
            katex: true
        }),
        palettePlugin({})
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
            {text: "首页", link: "/"},
            {
                text: "Java",
                children: [
                    {
                        text: "Java 基础知识",
                        children: [
                            {
                                text: "Java 反射",
                                link: "/md/java/basic/Java 反射.md"
                            },
                            {
                                text: "Java 注解",
                                link: "/md/java/basic/Java 注解.md"
                            },
                            {
                                text: "Java SPI 机制",
                                link: "/md/java/basic/Java SPI 机制.md"
                            }
                        ]
                    },
                    {
                        text: "Java 虚拟机",
                        children: [
                            {
                                text: "JVM 内存结构",
                                link: "/md/java/jvm/JVM 内存结构.md"
                            },
                            {
                                text: "JVM 类加载机制",
                                link: "/md/java/jvm/JVM 类加载机制.md"
                            }
                        ]
                    },
                    {
                        text: "Java 并发",
                        children: [
                            {
                                text: "Java 并发基础知识",
                                link: "/md/java/thread/Java 线程池：基础知识.md"
                            },
                            {
                                text: "思考与验证",
                                link: "/md/java/thread/think/浅谈synchronized和ReentrantLock的区别.md"
                            }
                        ]
                    }
                ],
            },
            {
                text: "算法",
                children: [
                    {
                        text: "算法题解",
                        children: [
                            {text: "剑指 Offer", link: "/md/algorithm/lcof/03 数组中重复的数字.md"}
                        ]
                    }
                ]
            },
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
                text: "项目",
                children: [
                    {
                        text: "项目踩坑",
                        link: "/md/project/problem/在Mybatis-Plus中指定TypeHandler后不生效的问题与解决办法.md",
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
            "/md/interview/": getSideBar4Interview(),
            "/md/algorithm/": getSidebar4Algorithm(),
            "/md/project/": getSidebar4Project(),
        }
    })
}

