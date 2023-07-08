function __getSideBar4Devops() {
    return [
        {
            text: "IDEA 插件推荐",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "实用插件推荐 - 禁用插件，让 IDE 飞起",
                    link: "/md/devops/intellij/recommoned/禁用非必需插件，让 IDE 飞起.html",
                    collapsible: false
                },
                {
                    text: "实用插件推荐 - Code Glance Pro",
                    link: "/md/devops/intellij/recommoned/实用插件推荐 CodeGlance Pro.html",
                    collapsible: false
                },
                {
                    text: "实用插件推荐 - Show Comment",
                    link: "/md/devops/intellij/recommoned/实用插件推荐 show comment.html",
                    collapsible: false
                },
                {
                    text: "实用插件推荐 - Key Promoter X",
                    link: "/md/devops/intellij/recommoned/实用插件推荐 Key Promoter X.html",
                    collapsible: false
                }
            ]
        },
        {
            text: "IDEA 插件开发",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Simple Deployment",
                    link: "/md/devops/intellij/plugin/Simple Deployment.html",
                    collapsible: false
                }
            ]
        },
        {
            text: "CI & CD",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "Jenkins 安装及自动部署",
                    link: "/md/devops/tool/Jenkins安装及自动部署.html",
                    collapsible: false,
                }
                
            ]
        }
    ]
}

export const getSideBar4Devops = __getSideBar4Devops
