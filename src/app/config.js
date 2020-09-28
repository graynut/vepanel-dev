export default {
    // 是否使用 vuex
    useVuex: false,

    // 路由模式
    routerMode: 'hash',

    // 页面url, 不指定则自动获取
    pageUrl: null,

    // 是否禁用 mock 数据 (在 product 模式下本来就是禁用的, 该配置无效)
    disableMock: false,

    // 请求后端 api 是否携带 cookie, (空|none: 不携带, same-origin|no-cors|cors|navigate 携带方式)
    // 关于携带方式, 可参考: https://developer.mozilla.org/zh-CN/docs/Web/API/Request/mode
    cookieMode: 'cors',

    // 内置 fetch 函数请求的 api prefix
    apiUrl: '',

    // 是否需要登陆检测
    auth: true,

    // 登录/退出 接口 api 地址
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