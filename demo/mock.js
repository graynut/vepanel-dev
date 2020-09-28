// 菜单
const makerMenu = {
    name: '表单制作',
    icon: 'el-icon-office-building',
    link: '/maker',
};
const demoMenus = [
    {
        name: '基础',
        title: '控制面板',
        icon: 'el-icon-office-building',
        menus: [
            {
                name: '控制面板',
                link: '/index',
                icon: 'el-icon-odometer',
            }, 
            {
                name: '单元测试',
                icon: 'el-icon-box',
                open: false,
                menus:[
                    {
                        name: '全局信息',
                        link: '/test/vars',
                        icon: 'el-icon-data-line',
                    },
                    {
                        name:'样式相关',
                        icon: 'el-icon-s-flag',
                    },
                    {
                        name: '静态资源',
                        link: '/test/assets',
                        icon: 'el-icon-document',
                    },
                    {
                        name: 'LESS测试',
                        link: '/test/less',
                        icon: 'el-icon-ship',
                    },
                    {
                        name: '代码相关',
                        icon: 'el-icon-folder-opened',
                        open: false,
                        menus:[
                            {
                                name: '内置函数',
                                link: '/test/api',
                            },
                            {
                                name: '接口请求',
                                link: '/test/fetch',
                            },
                            {
                                name:'模块依赖',
                                icon: 'el-icon-s-flag',
                            },
                            {
                                name: '全局组件',
                                link: '/test/import/global',
                            },
                            {
                                name: '远程导入',
                                link: '/test/import/remote',
                            },
                            {
                                name: '本地组件',
                                link: '/test/import/local',
                            },
                        ]
                    },
                ]
            },
            {
                name: '内置组件',
                link: '/element',
                icon: 'el-icon-coffee-cup',
            },
            {
                name: '可用图标',
                link: '/icon',
                icon: 'el-icon-grape',
            },
            {
                name: '外部链接',
                link: 'https://github.com/vepanel/vepanel',
                icon: 'el-icon-discover',
            },
            {
                name:'功能演示',
                icon: 'el-icon-s-flag',
            },
            {
                name: '后台设置',
                icon: 'el-icon-folder-opened',
                open: false,
                menus:[
                    {
                        name: '账户管理',
                        link: '/account',
                        icon: 'el-icon-user',
                    },
                    {
                        name: '表单演示',
                        link: '/form',
                        icon: 'el-icon-user',
                    },
                ]
            },
        ]
    },
    {
        name: '表单',
        title: '表单管理',
        menus: [
            makerMenu
        ]
    },
];

/**
 * 基础 Mock 数据
 */
export default {
    'login': [(res, req) => {
          return req.json().then(json => {
              if (json.user === 'admin' || json.user === 'user') {
                localStorage.setItem(':user', json.user);
                res.send()
              } else {
                res.send({
                    code:300,
                    message: '你输入的账号或密码不正确',
                })
              }
        })
    }, 500],

    '#logout': {
        code: 1002,
        message: '演示版本无法退出',
    },
    'logout': [(res) => {
        localStorage.removeItem(':user');
        return res.send()
    }, 500],

    '#auth':{
        uid:1,
        name:"admin",
        permissions:["foo", "bar"]
    },
    'auth': (res) => {
        const user = localStorage.getItem(':user');
        user ? res.send({
            uid: 1,
            name:user,
            permissions:["foo", "bar"]
        }) : res.status(401).send({});
    },

    '#menus': demoMenus,
    'menus': (res, req, {db}) => {
        let getForms;
        try {
            getForms = db.table('custom_form').toArray()
        } catch(e) {
            getForms = Promise.resolve([]);
        }
        return getForms.then(forms => {
            const formCustom = [];
            forms.forEach(item => {
                formCustom.push({
                    name: item.name,
                    icon: 'el-icon-tickets',
                    link: '/mform/' + item.id,
                })
            })
            demoMenus[1].menus = [makerMenu].concat(formCustom);
            res.send(demoMenus)
        })
    },
};