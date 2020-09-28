/**
 * appDes.js
 * 生成 js 可实时加载  (app 配置/ 首页模板 / 错误页模板 / .vue 页面)
 * 该版本主要用于调整 app 整体框架
 */
import {
    setLoaderConfig,
    getImportBlobUrl, 
    getImportResult, 
    httpVueLoader
} from "./vueLoader";
import {
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
} from './vepanel';

let appUrl = './../src/app/', appConf, baseUrl;
function importAppJs(name) {
    return getImportResult(appUrl + name + '.js');
}
function loadAppVue(name) {
    return httpVueLoader(appUrl + name + '.vue');
}

function init(Vue, VueRouter) {
    const options = {guard:false, handleError:false};
    return importAppJs('resolveRouter').catch(() => {
        return null;
    }).then(res => {
        if (res) {
            setFormatRouter(res);
        }
        return importAppJs('fetchGuard');
    }).catch(() => {
        return null;
    }).then(res => {
        if (res) {
            setFetchGuard(res);
        }
        return importAppJs('alert');
    }).catch(() => {
        return null;
    }).then(res => {
        if (res) {
            setAlertHandler(res);
        }
        return importAppJs('confirm');
    }).catch(() => {
        return null;
    }).then(res => {
        if (res) {
            setConfirmHandler(res);
        }
        return loadAppVue('error');
    }).then(error => {
        setErrorComponent(error);
        return true;
    }).catch(err => {
        console.error(err);
        return false;
    }).then(() => {
        if (!appConf.menus) {
            throw 'menus api not set'
        }
        if (!appConf.auth) {
            return {
                login: false,
                passport: {}
            }
        }
        if (!appConf.passport) {
            throw 'auth is enable, but not set passport api'
        }
        return fetchPlus(appConf.passport, options).then(user => {
            const login = user.status !== 200;
            return user.json().then(j => {
                return {
                    login,
                    passport: j
                }
            }).catch(err => {
                if (!login) {
                     throw 'load auth api failed';
                }
                return {
                    login,
                    passport: null
                }
            })
        })
    }).catch(err => {
        alert(appConf.authFailed);
        throw err;
    }).then(user => {
        if (user.login) {
            return loadAppVue('login').then(view => {
                return {view, menus:[], passport:user.passport, login:true}
            })
        }
        return fetchPlus(appConf.menus, options).then(res => {
            if (res.status !== 200) {
                throw 'load menus api failed';
            }
            return res.json();
        }).catch(err => {
            alert(appConf.menusFailed);
            throw err;
        }).then(menus => {
            return loadAppVue('index').then(view => {
                return {view, menus, passport:user.passport}
            })
        })
    }).then(app => {
        return initApp(Vue, VueRouter, app)
    })
}

function sfcLoader(name, isRoute) {
    // 路由
    if (isRoute) {
        return httpVueLoader(baseUrl + name + '.vue')
    }
    // 异步加载本地 vue/js 组件
    if (name.startsWith('!')) {
        return getImportBlobUrl(name.substr(1)).then(getImportResult);
    }
    // 加载远程组件
    return new Promise((resolve, reject) => {
        require([name], resolve, reject);
    })
}

function launch(conf) {
    appConf = setConf(conf);
    baseUrl = appConf.pageUrl ?  appConf.pageUrl : (confUrl ? getUrlBase(confUrl) : '') + 'view/';
    setSfcResolver(sfcLoader);
    setLoaderConfig(baseUrl, appConf.disableMock);
    loadApp(appConf, init);
}

function app() {
    // 配置 require 基础目录为 src/packages 源目录, vue 为完整版
    requirejs.config({
        baseUrl: "/src/packages/",
        baseName: "index.js",
        paths:{
            vue:"vue-full"
        }
    });
    importAppJs('config').then(defConf => {
        if (confUrl) {
            require([confUrl], conf => {
                launch({...defConf, ...conf})
            })
        } else {
            launch(defConf)
        }
    })
}

export default app;