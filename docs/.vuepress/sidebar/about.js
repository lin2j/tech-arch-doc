function __getSideBar4About() {
    return [
        {
            text: "关于",
            collapsible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "关于作者",
                    link: "/md/about/me.html",
                    collapsible: false
                },
                {
                    text: "错误反馈",
                    link: "/md/about/issue.html",
                    collapsible: false
                },
            ]
        }
    ]
}

export const getSideBar4About = __getSideBar4About
