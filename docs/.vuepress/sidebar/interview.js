function __getSideBar4Interview() {
    return [
        {
            text: '面试题',
            collasible: false,
            sidebarDepth: 0,
            children: [
                {
                    text: "数据库系列 - MySQL 基础问答",
                    link: "/md/interview/MySQL.md",
                    collasible: false,
                },
                {
                    text: "数据库系列 - Redis 基础问答",
                    link: "/md/interview/Redis.md",
                    collasible: false,
                },
            ]
        }
    ]
}

export const getSideBar4Interview = __getSideBar4Interview
