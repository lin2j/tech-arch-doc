import {mdEnhancePlugin} from 'vuepress-plugin-md-enhance'
import {palettePlugin} from '@vuepress/plugin-palette'
import {docsearchPlugin} from '@vuepress/plugin-docsearch'
import { clipboardPlugin } from 'vuepress-plugin-clipboard'

import vuepressPluginAnchorRight from 'vuepress-plugin-anchor-right';

import {defaultTheme} from 'vuepress'

import {getSideBar4Java} from './sidebar/java'
import {getSideBar4Devops} from './sidebar/devops'
import {getSideBar4Middleware} from './sidebar/middleware'
import {getSideBar4Interview} from './sidebar/interview'
import {getSidebar4Algorithm} from './sidebar/algorithm'
import {getSidebar4Project} from './sidebar/project'
import {getSideBar4About} from './sidebar/about'

const description = "包含：Java 基础知识，Java 进阶知识，开发框架，设计模式，数据库，中间件，计算机网络，面试题，算法，部署工具..."

export default {
    // 暗示在开发领域中，像艺术家一样精心创造代码和解决方案
    title: 'ByteCraft',
    description: description,
    plugins: [
        mdEnhancePlugin({
            // 启用幻灯片
            presentation: true,
            // 代码分 tab
            codetabs: true,
            katex: true
        }),
        palettePlugin({}),
        docsearchPlugin({
            appId: 'VK082AIGRQ',
            apiKey: 'b3444a55c45437a501ea99689c5beae3',
            indexName: 'lin2j',
            locales: {
                '/': {
                    placeholder: 'Search',
                    translations: {
                    button: {
                        buttonText: 'Search',
                        },
                    },
                },
            }
        }),
        vuepressPluginAnchorRight(),
        clipboardPlugin({}),
    ],
    locales: {
        "/": {
            lang: "zh-CN",
            title: "ByteCraft",
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
        sidebarType: 'right',
        displayAllHeaders: false,
        navbar: [
            {text: "首页", link: "/"},
            // {
            //     "text": "🤖️ ChatGPT",
            //     "link": "/md/chatgpt/chatgpt.html"
            // },
            {
                text: "Java",
                children: [
                    {
                        text: "Java 基础知识",
                        children: [
                            {
                                text: "Java 泛型机制",
                                link: "/md/java/basic/Java 泛型.html"
                            },
                            {
                                text: "Java 异常机制",
                                link: "/md/java/basic/Java 异常机制.html"
                            },
                            {
                                text: "Java 反射机制",
                                link: "/md/java/basic/Java 反射.html"
                            },
                            {
                                text: "Java 注解机制",
                                link: "/md/java/basic/Java 注解.html"
                            },
                            {
                                text: "Java SPI 机制",
                                link: "/md/java/basic/Java SPI 机制.html"
                            }
                        ]
                    },
                    {
                        text: "Java 并发",
                        children: [
                            {
                                text: "Java 线程",
                                link: "/md/java/thread/Java 并发 线程基础.html"
                            },
                            {
                                text: "Java 线程池",
                                link: "/md/java/thread/Java 线程池 ThreadPoolExecutor 详解.html"
                            },
                            {
                                text: "JUC 锁",
                                link: "/md/java/thread/JUC 锁 LockSupport 详解.html"
                            },
                            {
                                text: "JUC 工具类",
                                link: "/md/java/thread/JUC 工具类 CountDownLatch 详解.html",
                            }

                        ]
                    },
                    {
                        text: "Java 虚拟机",
                        children: [
                            {
                                text: "JVM 内存结构",
                                link: "/md/java/jvm/JVM 内存结构.html"
                            },
                            {
                                text: "JVM 类加载机制",
                                link: "/md/java/jvm/JVM 类加载机制.html"
                            }
                        ]
                    },
                ],
            },
            {
                text: "算法",
                children: [
                    {
                        text: "算法题解",
                        children: [
                            {text: "剑指 Offer", link: "/md/algorithm/lcof/03 数组中重复的数字.html"}
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
                            {text: "Kafka 系列", link: "/md/middleware/kafka/Kafka系列一消息队列.html"}
                        ]
                    }
                ]
            },
            {
                text: "项目",
                children: [
                    {
                        text: "项目踩坑",
                        link: "/md/project/problem/在Mybatis-Plus中指定TypeHandler后不生效的问题与解决办法.html",
                    }
                ]
            },
            {
                text: "面试",
                link: "/md/interview/MySQL.html",
            },
            {
                text: "工具｜部署",
                children: [
                    {
                        text: "IntelliJ",
                        children: [
                            {text: "实用插件推荐", link: "/md/devops/intellij/recommoned/禁用非必需插件，让 IDE 飞起.html"},
                            {text: "插件开发", link: "/md/devops/intellij/plugin/Simple Deployment.html"}
                        ]
                    },
                    {
                        text: "CI & CD",
                        children: [
                            {text: "Jenkins", link: "/md/devops/tool/Jenkins安装及自动部署.html"}
                        ]
                    }
                ]
            },
            {
                "text": "关于",
                "link": "/md/about/me.html"
            }
        ],
        sidebar: {
            "/md/java/": getSideBar4Java(),
            "/md/devops/": getSideBar4Devops(),
            "/md/middleware/": getSideBar4Middleware(),
            "/md/interview/": getSideBar4Interview(),
            "/md/algorithm/": getSidebar4Algorithm(),
            "/md/project/": getSidebar4Project(),
            "/md/about/": getSideBar4About(),
        }
    })
}

