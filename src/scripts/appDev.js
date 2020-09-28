/**
 * 入口文件: appDev.js
 * 打包 app 目录, 生成 js 可实时加载 (.vue 页面)
 */
import launch from './launcher';
import DefConf from '@app/config.js';
import {confUrl, getUrlBase, setSfcResolver} from './vepanel';
import {
    setLoaderConfig,
    getImportBlobUrl, 
    getImportResult, 
    httpVueLoader
} from "./vueLoader";

let baseUrl;

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

function boot(conf) {
    baseUrl = conf.pageUrl ? conf.pageUrl : (confUrl ? getUrlBase(confUrl) : '') + 'view/';
    setLoaderConfig(baseUrl, conf.disableMock);
    setSfcResolver(sfcLoader);
    launch(conf);
}

function app() {
    // 配置 baseUrl 为远程版, vue 为完整版
    requirejs.config({
        baseUrl: "https://cdn.jsdelivr.net/npm/@vepanel/",
        paths:{
            vue:"vue-full"
        }
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