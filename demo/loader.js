(function() {
    // 可选: 设置 requireJs 参数
    var config = {
        paths:{
            "vue-star": ['https://cdn.jsdelivr.net/npm/vue-star', "https://unpkg.com/vue-star"]
        },
        alias:{
            npm: {
                baseName: null,
                baseUrl:["https://cdn.jsdelivr.net/npm/", "https://unpkg.com/"],
            },
            test: ["https://cdn.jsdelivr.net/npm/", "https://unpkg.com/"],
        },
    };
    if (require.vepanel !== 'des') {
        config.baseUrl = "/packages/";
        config.baseName = 'index';
    }
    requirejs.config(config);


    // 可选: 可仅返回 vepanel 参数，也可进行一些其他操作，参见下面
    // define(function(){
    //     return {}
    // })


    // 设置 vepanel 参数，并 加载自定义css, 注册全局组件
    define(['vue', '//at.alicdn.com/t/font_1668973_3pzet4s6hjs.css'], function(Vue) {

        // 异步注册, 使用时才加载
        Vue.component('VueStar', function (resolve) {
            require(['vue-star'], resolve)
        })

        return {
            // 是否使用 vuex
            useVuex: false,

            // 路由模式
            routerMode: 'hash',

            // 页面组件 url prefix, 不指定则自动获取
            pageUrl: require.vepanel === 'app' ? 'dist/' : 'view/',

            // 是否禁用 mock 数据 (在 product 模式下本来就是禁用的, 该配置无效)
            disableMock: false,

            // 请求后端 api 是否携带 cookie, (空|none: 不携带, same-origin|no-cors|cors|navigate 携带方式)
            // 关于携带方式, 可参考: https://developer.mozilla.org/zh-CN/docs/Web/API/Request/mode
            cookieMode: 'cors',

            // 内置 fetch 函数请求的 api prefix
            apiUrl: 'mock',

            // 是否需要登陆检测
            auth: true,

            // 登录/退出 接口 api 地址, 最终 API 地址为 apiUrl/login 组合而成
            // 若不需要自动添加 apiUrl, 可直接设置为绝对地址, 如  login: "/login"
            login:'login',
            logout:'logout',

            // 获取用户登录信息的接口 api，若不需要登陆则不生效
            passport: 'auth',

            // 检测登陆状态失败提示词
            authFailed: '无法获取登陆状态，请稍后再试',

            // 获取后台菜单的接口 api 地址
            menus: 'menus',

            // 获取菜单失败的提示词
            menusFailed: '连接服务器失败，请稍后再试',
        }
    })
})()
