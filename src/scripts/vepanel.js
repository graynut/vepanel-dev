/**
 * vepanel.js
 * require 插件扩展, vue 中台基本框架
 */
import {myFetch} from "./vueLoader";
import {startProgress, endProgress} from "./progress";

require.vepanel = process.env.BUILD_TYPE;

// utils 函数
const _DOC = document,
    _HEAD = _DOC.head || _DOC.getElementsByTagName('head')[0] || _DOC.documentElement,
    _BaseElement = _HEAD.getElementsByTagName("base")[0],
    isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, rawPos) {
            const pos = rawPos > 0 ? rawPos|0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}
if (!Object.entries) {
    Object.entries = function( obj ){
      let ownProps = Object.keys( obj ),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array
      while (i--)
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
      return resArray;
    };
}
function insertNodeToHeader(node) {
    _BaseElement ? _HEAD.insertBefore(node, _BaseElement) : _HEAD.appendChild(node);
}
function getUrlBase(url){
    var a = document.createElement('a');
    a.href = url;
    return a.href.substring(0, a.href.lastIndexOf('/') + 1);
}

/** vue runtime helper / requirejs 插件
    vue cli 编译会将 vue 本身和一些 runtime helper 函数编译到公用的 app.js
    以便于页面组件直接使用这些公用函数, vue 可使用 cdn 直接加载, 但并不包含 runtime helper
    所以这里将 runtime helper 放到这里, 注入到 require js 中, 并在 rollup 编译配置中导入供 vue 页面组件使用
    vue component helper (inject inline style)
    https://github.com/znck/vue-runtime-helpers/blob/v1.1.2/src/inject-style/browser.ts
********************************************************************************************************/
const styles = {};
function createInjector(context) {
    return function (id, style) {
        return addStyle(id, style);
    };
}
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = {
        ids: new Set(),
        styles: []
    });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (!style.element) {
            style.element = _DOC.createElement('style');
            style.element.type = 'text/css';
            if (css.media) { 
                style.element.setAttribute('media', css.media);
            }
            insertNodeToHeader(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
        } else {
            const index = style.ids.size - 1;
            const textNode = _DOC.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index]) { 
                style.element.removeChild(nodes[index]); 
            }
            if (nodes.length) { 
                style.element.insertBefore(textNode, nodes[index]); 
            } else { 
                style.element.appendChild(textNode); 
            }
        }
    }
}
// vue component helper (normalize component object)
// https://github.com/znck/vue-runtime-helpers/blob/master/src/normalize-component.ts
function normalizeComponent(
    template, 
    style, 
    script, 
    scopeId, 
    isFunctionalTemplate, 
    moduleIdentifier/* server only */, 
    shadowMode,
    createInjector
) {
    var options = typeof script === 'function' ? script.options : script;
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true; 
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    if (scopeId) {
        options._scopeId = scopeId;
    }
    if (style) {
        var hook = function (context) {
            style.call(this, createInjector(context));
        };
        if (options.functional) {
            var originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        } else {
            // inject component registration as beforeCreate hook
            var existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

//vConf 配置
let vConf = {}, confUrl = (() => {
    let scripts = _DOC.getElementsByTagName('script'),
        len = scripts.length,
        i, u;
    for (i=0; i<len; i++) {
        u = scripts[i].getAttribute('conf');
        if (u) {
            return u;
        }
    }
    return null;
})();
function setConf(conf){
    vConf = conf;
    vConf.pageUrl = vConf.pageUrl.replace(/\/+$/, '') + '/';
    vConf.apiUrl = vConf.apiUrl.replace(/\/+$/, '') + '/';
    define("vepanel", [], {
        s: requirejs.s.contexts._.config.baseUrl,
        m: conf.viewUrl,
        n: normalizeComponent,
        c: createInjector
    });
    return vConf;
}

/**
 * 给 des/dev/app 的预留接口
 **************************************************************/

// alert/confirm 函数
let alertHandler, confirmHandler;
function setAlertHandler(handler) {
    alertHandler = handler
}
function setConfirmHandler(handler) {
    confirmHandler = handler;
}
function alertAuto(message, code) {
    if (!alertHandler) {
        return new Promise(resolve => {
            alert((code ? '['+code+']' : '') + message)
            resolve(true);
        })
    }
    return alertHandler(appRootVm, message, code);
}
function confirmAuto(message) {
    if (!confirmHandler) {
        return new Promise(resolve => {
            if (confirm(message)) {
                resolve(true);
            }
        })
    }
    return confirmHandler(appRootVm, message);
}

// 设置 接收到 请求结果后的统一处理函数
let fetchGuardHandler;
function setFetchGuard(handler) {
    fetchGuardHandler = handler
}

// 设置 将 menus 转为 vue router 的函数
let formatRouter;
function setFormatRouter(handler){
    formatRouter = handler;
}

// 设置加载页面组件的方法, des/dev 使用的是 vueLoader .vue 文件, app 是 require 编译过的页面js
let sfcResolver = function(path) {
    const Err = new Error("can't load[" + path +']');
    Err.code = 404;
    return Promise.reject(Err);
};
function setSfcResolver(resolver) {
    sfcResolver = resolver;
}

// 设置 error 组件
let appErrorComponent = {
    render:function(h){
        return h('div', {}, ['Error - ' + this.code])
    }
};
function setErrorComponent(component) {
    appErrorComponent = {
        name: 'AppError',
        extends: component,
        props: {
            type: {
                default:0
            }, 
            code: {
                default:404
            },
            text: {
                default: null
            }
        }
    };
}

/**
 * 框架组件
 **************************************************************/
// 根组件
let appRootVm;

// loading 组件
let appLoader, appLoaderTag, appLoaderClass, appLoaderHtml;
appLoader = _DOC.getElementById('app_loader');
if (appLoader) {
    appLoaderTag = appLoader.tagName;
    appLoaderClass = appLoader.className;
    appLoaderHtml = appLoader.innerHTML;
} else {
    appLoaderTag = 'DIV';
    appLoaderHtml = '<center>loading...</center>';
}
const appLoaderComponent = {
    functional: true,
    render(h){
        return h(appLoaderTag, {
            class:appLoaderClass,
            domProps: {
                innerHTML: appLoaderHtml
            },
        });
    }
};

// 总框架中嵌套的错误页 和 访问未定义路由的 404  error组件
// 错误页, 会通过 props 注入 type/code/text, 发生场景:
// type=0. 访问不存在路由
// type=1. 在加载页面 js 组件发生错误时
// type=2. 调用 $admin.error(code, text), 主动显示 隐藏在总框架中 错误展示页
let routerErrorCode = null;
let routerErrorText = null;
let routerErrorResolve = false;
let routerErrorCustomize = false;
const appRouterError = {
    functional: true,
    render(h, ref) {
        const data = ref.data;
        const props = 'props' in data ? data.props||{} : {};
        if (routerErrorCustomize) {
            props.type = 2;
            props.code = routerErrorCode;
            props.text = routerErrorText;
        } else {
            props.type = 0;
            props.code = 404;
            props.text = null;
        }
        data.props = props;
        return h(appErrorComponent, data);
    }
};

// 加载路由页面组件发生错误时的 error组件
const routerComponentErrors = {};
const appRouterIssue = {
    functional: true,
    render(h, ref) {
        const data = ref.data;
        const props = 'props' in data ? data.props||{} : {};
        const path = appRootVm.$route.path;
        props.type = 1;
        if (routerErrorResolve) {
            routerErrorResolve = false;
            props.code = routerErrorCode;
            props.text = routerErrorText;
            routerComponentErrors[path] = {c:routerErrorCode,t:routerErrorText};
        } else if (path in routerComponentErrors) {
            props.code = routerComponentErrors[path].c;
            props.text = routerComponentErrors[path].t;
        } else {
            props.code = 600;
            props.text = null;
        }
        data.props = props;
        return h(appErrorComponent, data);
    }
}

// 显示错误页
function httpError(code, text) {
    setErrorProps(code, text);
    routerErrorCustomize = true;
    appRootVm.$forceUpdate();
}
function setErrorProps(code, text) {
    routerErrorCode = code;
    routerErrorText = text;
}

// 懒加载 路由组件的方法
function resolveRouter(path) {
    const AsyncHandler = function() {
        return resolveComponent(path, true, true);
    };
    return function() {
        return Promise.resolve({
            functional: true,
            render(h, ref) {
                return h(AsyncHandler, ref.data, ref.children)
            }
        })
    } 
}

// 异步加载 vue 组件
function resolveComponent(path, spinner, isRoute) {
    const component = sfcResolver(path, isRoute).then(function (obj) {
        if (obj !== null && typeof obj === 'object') {
            return obj;
        }
        const Err = new Error("Component [" + path + "] render/template not defined");
        Err.code = 600;
        throw Err;
    }).catch(err => {
        const errType = typeof err;
        let code = 600, text = null;
        if (errType  === 'object') {
            if ('code' in err) {
                code = err.code;
            }
            const msg = 'toString' in err && typeof err.toString === 'function' ? err.toString() : null;
            if (msg && typeof msg === 'string') {
                text = msg;
            }
        } else if (errType === 'string') {
            text = err;
        }
        err.format = {code, text};
        if (process.env.BUILD_TYPE !== 'app') {
            console.error(err)
        }
        throw err;
    }).catch(err => {
        routerErrorResolve = true;
        setErrorProps(err.format.code, err.format.text);
        throw err;
    });
    return spinner ? {
        component,
        loading: appLoaderComponent,
        error: appRouterIssue
    } : component;
}

// 每次加载 router 组件时, 记录一下历史记录, 并判断当前加载是 直接访问 / 浏览器后退 / 浏览器前进
let hisDirection = 0;
let currentKeyIndex = 0;
const historyKeys = [];
function getHistoryStateKey() {
    return history.state && 'key' in history.state ? history.state.key : null;
}
function cacheHisKey() {
    const key = getHistoryStateKey();
    if (!key) {
        return;
    }
    const index = historyKeys.indexOf(key);
    if (index < 0) {
        historyKeys.push(key);
        hisDirection = 0;
        currentKeyIndex = historyKeys.length - 1;
    } else {
        hisDirection = index > currentKeyIndex ? 1 : (index < currentKeyIndex ? -1 : 0);
        currentKeyIndex = index;
    }
}

// keep-alive 包裹的 router 组件, 没办法刷新
// 绕个弯路, 先跳到 /reload 然后再跳回去, 这样才会触发组件的 activated
let previousPath = '/';
let reloaderState = false;
let reloaderActive = false;
const reloaderComponent = {
    name: 'AppReloader',
    beforeRouteEnter(to, from, next) {
        previousPath = from.fullPath;
        next()
    },
    activated() {
       reloaderActive = true;
       this.$router.replace({
            path: previousPath
       });
    },
    render(h) {
        return h('i')
    }
}

// 刷新当前路由页
function reoladRouter() {
    routerErrorCustomize = false;
    appRootVm.$router.replace({
        path:'/reload'
    })
}

// 获取打开类型  0:点击链接激活, 1:前进按钮激活, -1:后退按钮激活, 2:调用刷新函数激活
function getLoaderType() {
    return reloaderState ? 2 : hisDirection;
}

// 总框架 app-view 组件 (<div> <error/> <keep-alive> <router-view/> </keep-alive> </div>)
// 调用 <app-view max="10"/> max 为 keepAlive 的最大数
const appView = {
    functional: true,
    render(h, ref) {
        cacheHisKey();
        const routerData = ref.data;
        const keepAliveMax = {};
        const max = 'attrs' in routerData && 'max' in routerData.attrs ? routerData.attrs.max : null;
        if (max !== null) {
            delete routerData.attrs.max;
            keepAliveMax.attrs = {max}
        }
        const errorData = {};
        const staticStyle = 'staticStyle' in routerData ? routerData.staticStyle : {};
        if (routerErrorCustomize) {
            staticStyle.display = "none";
        } else {
            staticStyle.display = "";
            errorData.staticStyle = {display:"none"};
        }
        routerData.staticStyle = staticStyle;
        return h('div', {staticClass:"app-view"}, [
            h(appRouterError, errorData),
            h('keep-alive', keepAliveMax, [
                h('router-view', routerData, ref.children)
            ],1)
        ] ,1);
    }
}

/**
 * fetch api 方法
 **************************************************************/
// http 错误码对应提示信息
const codeMessage = {
    400: '请求数据不正确',
    401: '您还未登录或登录过期',
    403: '您无权执行该操作',
    404: '您执行的操作不存在',
    500: '服务器出错了',
    502: '网关发生错误',
    503: '服务器过载或正在维护',
    504: '请求网关超时',
    600: '请求发生错误'
}

// resolveResponse 会将该对象交给 fetchGuard 预处理
class PreResponse {
    constructor(response, resJson) {
        this.code = 0;
        this.message = null;
        this.resJson = resJson;
        this.response = response;
    }
    setResponse(res) {
        this.response = res;
    }
    setError(code, message) {
        this.code = code;
        this.message = message;
    }
}

// 修改 Request 的 url 属性创建新的 Request
function makeRequest(request, url, options) {
    var init = {};
    [
        'method', 'headers', 'body', 'mode', 'credentials', 
        'cache', 'redirect', 'referrer', 'integrity', 
        'referrerPolicy', 'destination'
    ].forEach(function(k) {
        init[k] = options && k in options ? options[k] : request[k];
    });
    return new Request(url, init);
}

// 格式化 fetch 抛出的异常, 以方便显示 error
function throwBadResponse(code, msg, request, response, error){
    const resError = new Error(msg);
    resError.code = code;
    resError.request = request;
    resError.response = response;
    resError.error = error;
    throw resError;
}

// 开发版使用可 mock 的 fetch / 生产版使用浏览器 fetch
function fetchAuto(request) {
    if (process.env.BUILD_TYPE === 'app') {
        return fetch(request)
    } else {
        return myFetch(request);
    }
}

// 处理 API 请求发送
function resolveRequest(input, init, resJson) {
    // input 为 Request 的话, 其设置的 mode 无效, mode 必须在 init 中指定
    // 若未指定, 自动设置为 vConf.cookieMode, 并设置 credentials
    let {mode, credentials, url, ...options} = init||{};
    if (!mode && vConf.cookieMode !== '' && vConf.cookieMode !== 'none') {
        options.mode = vConf.cookieMode;
        if (!credentials) {
            options.credentials = 'include';
        }
    }
    const isRequest = input instanceof Request;
    // 若 body 为 Object, 自动 stringify, 若未指定 method 且有 body, 自动 method=post
    if (options.body) {
        const method = (options.method ? options.method : (isRequest ? input.method : '')).toUpperCase();
        const emptyMethod = method === '';
        if (emptyMethod || method === 'POST' || method === 'PUT' || method === 'DELETE') {
            if (typeof options.body !== 'string' && !(options.body instanceof FormData)) {
                options.body = JSON.stringify(options.body);
            }
            if (emptyMethod) {
                options.method = 'POST';
            }
        }
    }
    let request;
    if (isRequest) {
        if (url && url !== input.url) {
            request = makeRequest(
                input, 
                isAbsoluteUrl(url) ? url : (vConf.apiUrl + url), 
                options
            )
        } else {
            request = new Request(input, options);
        }
    } else {
        input = url||input;
        request = new Request(
            isAbsoluteUrl(input) ? input : (vConf.apiUrl + input),
            options
        );
    }
    // 针对非生产版, 添加上 _url 给 myFetch 判断是否可使用 mock 数据
    if (process.env.BUILD_TYPE !== 'app') {
        if (!url) {
            url = isRequest ? input.url : input;
        }
        const _url = isAbsoluteUrl(url) ? (
            url.startsWith(vConf.apiUrl) ? url.substr(vConf.apiUrl.length) : null
        ) : url;
        request._url = _url||url;
    }
    // resJson 的话, 自动添加一个 header
    if (resJson && !request.headers.has('Accept')) {
        request.headers.set('Accept', 'application/json');
    }
    return request;
}
function isAbsoluteUrl(url) {
    return /^\/|:/.test(url)
}

// 处理 API 返回结果
function resolveResponse(request, response, resJson) {
    if (response.status < 200 || response.status >= 300) {
        throwBadResponse(response.status, codeMessage[response.status] || response.statusText || '服务器出错了', request, response)
    }
    const res = new PreResponse(response, resJson);
    return Promise.resolve(fetchGuardHandler(res)).then(()  => {
        if (res.code !== 0) {
            throwBadResponse(res.code, res.message || codeMessage[res.code] || '服务器出错了', request, response)
        }
        return res.response;
    })
}

// 处理 API 请求异常 (401 异常认为是未登录, 直接刷新)
function resolveError(error, handleError, alertError) {
    if (!handleError) {
        throw error;
    }
    if (error.response && error.response.status === 401) {
        alertAuto(codeMessage[401]).then(() => {
            location.reload()
        })
        return;
    }
    const showPage = alertError === null ? error.request.method === 'GET' : !alertError;
    if (showPage) {
        httpError(error.code, error.message)
    } else {
        alertAuto(error.message, error.code)  
    }
    if (process.env.BUILD_TYPE !== 'app') {
        console.dir(error)
    }
    throw error;
}

/**
 * 处理 fetch 请求, 相比原生 fetch, 新增特性
 * 1. input 为 [非 http://] [非 /] 开头的相对 url 时, 会自动添加上 vConf.apiUrl 前缀
 *    若 input 为 Request 对象, 其 url 肯定是 http 开头, 所以希望自动添加 apiUrl 前缀的话 
 *    需要通过 init 设置 init.url 为相对 url
 * 2. 开发版模式下，可使用 mock 数据
 * 3. fetch 默认参数改为 mode='cors', credentials='include', 可通过 init 强制修改
 * 4. 请求时会自动显示 Progerss bar
 * 5. response 默认经过 fetchGuard 预处理 (可使用 init.guard = false 关闭预处理)
 * 6. 异常自动以合适的方式显示：get 以错误页显示, post 以 alert 提醒
 *    可使用 init.handleError = false 关闭该特性, 将不再显示或弹出错误
 *    可使用 init.alertError = true|false 强制使用 alert 或 page, 不设置则根据 method 自动
 * 7. 请求抛出的异常会被格式化, 含有 code/message 字段, 可能包含 request/response/error 信息
 */
function resolveFetch(input, init, resJson) {
    startProgress();
    const {guard=true, handleError=true, alertError=null, ...options} = init||{};
    const request = resolveRequest(input, options, resJson);
    return fetchAuto(request).catch(err => {
        throwBadResponse(600, codeMessage[600], request, null, err)
    }).then(res => {
        return guard ? resolveResponse(request, res, resJson) : (resJson ? res.json() : res);
    }).then(res => {
        endProgress();
        return res;
    }).catch(err => {
        endProgress();
        resolveError(err, handleError, alertError)
    });
}

function fetchPlus(input, init, resJson) {
    return resolveFetch(input, init, resJson);
}

function fetchJson(input, init) {
    return resolveFetch(input, init, true);
}

function postJson(input, body) {
    return resolveFetch(input, {method:"POST", body}, true);
}

/**
 * 简单的全局 kv 缓存功能
 **************************************************************/
const cacheStore = {};
function setStore(k, v) {
    cacheStore[k] = v;
}
function getStore(k) {
    return k in cacheStore ? cacheStore[k] : undefined;
}

/** 
 * 加载总框架 
 * 1. 参数 app 格式: {view:Object, menus:Array, passport:Object, login:Bool}
 * 2. 将 AppView, loading 注册为组件
 * 3. 注入一个 $admin 全局变量, 可以在任意组件中通过 this.$admin 调用
 **************************************************************/
function initApp(Vue, VueRouter, app) {
    const {view, menus, passport, login} = app||{};
    const permissions = 'permissions' in passport && Array.isArray(passport.permissions) 
        ? passport.permissions : false;
    Vue.prototype.$perms = (perm, or) => {
        if (permissions === false) {
            return true;
        }
        if (Array.isArray(perm)) {
            var check = r => permissions.includes(r);
            return or ? perm.some(check) : perm.every(check)
        }
        return permissions.includes(perm);
    }
    Vue.prototype.$admin = {
        config: vConf,
        reload: reoladRouter,
        loadType: getLoaderType,
        error: httpError,
        alert: alertAuto,
        confirm: confirmAuto,
        setStore,
        getStore,
        startProgress,
        endProgress,
        fetch:fetchPlus,
        fetchJson,
        postJson,
    };
    Vue.component('AppView', appView);
    Vue.component('appLoading', appLoaderComponent);
  
    let routes = formatRouter ? formatRouter(menus, resolveRouter) : [];
    if (!routes.length && !login) {
        console.warn('app routes is empty')
    }
    // 第一个添加 loader 组件 最后添加默认 400 handle 组件
    routes = [{
        path:'/reload',
        component: reloaderComponent
    }].concat(routes, [{
        path:'*',
        component: appRouterError
    }]);
    const routerConfig = {
        mode: vConf.routerMode,
        routes
    };
    const router = new VueRouter(routerConfig);
    router.beforeEach((to, from, next) => {
        // 隐藏错误页
        routerErrorCustomize = false;
        // 针对跳转页特殊处理
        if (reloaderActive) {
            reloaderActive = false;
            reloaderState = true;
        } else {
            reloaderState = false;
        }
        next();
    });
    // 注入 router/menus/passport 到 view 并实例化
    view.el = '#app';
    view.router = router;
    view.mixins = [{
        data: {
            menus,
            passport
        },
        methods:{
            reloadMenu(){
                return fetchJson(vConf.menus).then(r => {
                    return this.menus = r;
                });
            },
            reloadPassport(){
                if (!vConf.passport){
                    return Promise.resolve({})
                }
                return fetchJson(vConf.passport).then(r => {
                    return this.passport = r;
                });
            },
        }
    }];
    appRootVm = new Vue(view);
    // 移除 html 中的静态 loading 标签
    if (appLoader) {
        appLoader.parentNode.removeChild(appLoader);
        appLoader = null;
    }
}

// 加载 APP 核心依赖
function loadApp(conf, init){
    const deeps = ['vue', 'vue-router'];
    if (conf.useVuex) {
        deeps.push('vuex')
    }
    require(deeps, (Vue, VueRouter, Vuex) => {
        Vue.config.devtools = process.env.BUILD_TYPE !== 'app';
        Vue.config.warnHandler = function (msg, vm, trace) {
            console.warn(("[Vue warn]: " + msg + trace));
        }
        Vue.use(VueRouter);
        if (conf.useVuex) {
            Vue.use(Vuex);
        }
        require(['last!element/theme.css,name!ELEMENT:element'], (elm) => {
            Vue.use(elm);
            init(Vue, VueRouter, conf);
        })
    })
}

// 加载异步组件的函数 放到 window 全局函数中
global.requireComponent = (path, spinner) => {
    return resolveComponent(path, spinner, false)
};

export {
    confUrl,
    setConf,
    getUrlBase,
    setAlertHandler,
    setConfirmHandler,
    setFetchGuard,
    setFormatRouter,
    setSfcResolver,
    setErrorComponent,
    fetchPlus,
    initApp,
    loadApp
};