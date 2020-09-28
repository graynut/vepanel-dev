/**
 * 入口文件: app.js
 * 生产环境使用, 生成 js 必须加载 经过编译的vue组件(runtime vue component)
 */
import launch from './launcher';
import DefConf from '@app/config.js';
import {confUrl, getUrlBase, setSfcResolver} from './vepanel';

let baseUrl;

function sfcLoader(name, isRoute) {
    const path = isRoute ? baseUrl + name + '.js' : name;
    return new Promise((resolve, reject) => {
        require([path], resolve, reject);
    })
}

function boot(conf) {
    baseUrl = conf.pageUrl ? conf.pageUrl : (confUrl ? getUrlBase(confUrl) : '');
    setSfcResolver(sfcLoader);
    launch(conf);
}

function app() {
    // 配置 baseUrl 为远程版
    requirejs.config({
        baseUrl: "https://cdn.jsdelivr.net/npm/@vepanel/",
    });
    if (confUrl) {
        require([confUrl], conf => {
            boot({...DefConf, ...conf})
        })
    } else {
        boot(DefConf)
    }
}

export default app;