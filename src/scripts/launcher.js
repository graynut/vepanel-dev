
/**
 * launcher.js
 * 打包 config / index.vue / error.vue / login.vue 的加载库
 * 用于 appDev 和 app
 */
import {
    setConf,
    setAlertHandler,
    setConfirmHandler,
    setFetchGuard,
    setFormatRouter,
    setErrorComponent,
    fetchPlus,
    initApp,
    loadApp
} from './vepanel';
import AlertHandler from '@app/alert.js';
import ConfirmHandler from '@app/confirm.js';
import fetchGuard from '@app/fetchGuard.js';
import ErrorComponent from "@app/error.vue";
import LoginComponent from "@app/login.vue";
import IndexComponent from "@app/index.vue";
import resolveRouter from '@app/resolveRouter.js';

// 初始化: 是否需要认证 -->  不需要 ------------> initApp
//                   -->  需要   -> 认证通过 -> initApp
//                              -> 认证失败 -> 显示LoginComponent
function init(Vue, VueRouter, conf) {
    const options = {guard:false, handleError:false};
    return Promise.resolve().then(() => {
        if (!conf.menus) {
            throw 'menus api not set'
        }
        if (!conf.auth) {
            return {
                login: false,
                passport: {}
            }
        }
        if (!conf.passport) {
            throw 'auth is enable, but not set passport api'
        }
        return fetchPlus(conf.passport, options).then(user => {
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
    }).catch(() => {
        alert(conf.authFailed);
        throw err;
    }).then(user => {
        if (user.login) {
            return {view:LoginComponent, menus:[], passport:user.passport, login:true}
        }
        return fetchPlus(conf.menus, options).then(res => {
            if (res.status !== 200) {
                throw 'load menus failed';
            }
            return res.json();
        }).catch(err => {
            alert(conf.menusFailed);
            throw err;
        }).then(menus => {
            return {view:IndexComponent, menus, passport:user.passport}
        })
    }).then(app => {
        return initApp(Vue, VueRouter, app)
    })
}

function launch(conf) {
    setConf(conf);
    setAlertHandler(AlertHandler);
    setConfirmHandler(ConfirmHandler);
    setFormatRouter(resolveRouter);
    setErrorComponent(ErrorComponent);
    setFetchGuard(fetchGuard);
    loadApp(conf, init);
}

export default launch;
