/**
 * vueLoader.js
 * 使用浏览器加载并解析 .vue 单文件组件的库 
 */

// 可用的全局 className, 作用参见 StyleContext 类中的 scopeStyles 注释
// 一般为 app/index.vue 中定义过的全局 class 名称
const topClassName = [
    '.app-phone'
];
let _srcBaseUrl = '';
let _disableMock = false;
function setLoaderConfig(baseUrl, disableMock) {
    _srcBaseUrl = baseUrl;
    _disableMock = disableMock;
}

/**
 * utils
 * 处理 import 和静态资源
 */
let scopeIndex = 0;
let _resolvedModulesObj = {};
let _resolvedModulesBlob = {};

const importRegex = /(import\s+([^"')]+\s+from\s)?['"])([^"')]+)(['"]\s?[\;|\n])/gi;
const lessImportRegex = /(import\s+['"])([^"')]+)(['"]\s?[\;|\n])/gi;
const assetsExtension = /\.(svg|png|jpg|jpeg|gif|mp3|mp4)$/;

/**
 * 去除注释
 * 该版本 这样子的也会被无情过滤
 * const json = {"url":"//www.aaa.com"}
 */
// var commentRegex = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;
// function removeComments(code) {
//     return code.replace(commentRegex, '$1');
// }

/**
 * 这个版本 没搞明白  但实测还是比较好用的
 * 暂时用这个版本，来源
 * https://stackoverflow.com/a/28974757
 */
const commentRegexForm = /((?:(?:^[ \t]*)?(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/(?:[ \t]*\r?\n(?=[ \t]*(?:\r?\n|\/\*|\/\/)))?|\/\/(?:[^\\]|\\(?:\r?\n)?)*?(?:\r?\n(?=[ \t]*(?:\r?\n|\/\*|\/\/))|(?=\r?\n))))+)|("(?:\\[\S\s]|[^"\\])*"|'(?:\\[\S\s]|[^'\\])*'|(?:\r?\n|[\S\s])[^\/"'\\\s]*)/gm;
function removeComments(code) {
    return code.replace(commentRegexForm, '$2')
}

// 格式化 静态资源路径为 绝对路径
function getAssetRealPath(url, base) {
    const char = url[0];
    if (char === '@') {
        return _srcBaseUrl + url.substr(1).replace(/^\//g, '');
    } else if (char === '~') {
        let modules_dir = _srcBaseUrl + '../node_modules/';
        // des 版本, SFC 文件也可能来自于 组件
        if (process.env.BUILD_TYPE === 'des') {
            const parse = new URL(base, 'http://localhost');
            if (parse.pathname.indexOf('/src/packages/') > -1) {
                modules_dir = parse.pathname.split('/').slice(0, 4).join('/') + '/node_modules/'
            }
        }
        return modules_dir + url.substr(1).replace(/^\//g, '');
    } else if (char === '.') {
        return getAbsolutePath(base, url)
    }
    return url;
}

// 获取 url 的绝对地址
function getAbsolutePath(base, relative) {
    var stack = base.split("/"),
        parts = relative.split("/");
        stack.pop();
    for (var i=0; i<parts.length; i++) {
        if (parts[i] == ".") {
            continue;
        }
        if (parts[i] == "..") {
            stack.pop();
        } else {
            stack.push(parts[i]);
        }   
    }
    return stack.join("/");
}

// 对于 import 的 es6 js, 其为 export default 的, 直接获取导出的 default
function getImportResult(url) {
    return (url.startsWith('blob:') ? Promise.resolve(url) : getImportUrl(url)).then(source => {
        return windowImport(source).then(function(e){
            return e.default;
        })
    })
}

// 转 code 为 ObjectURL
function createCodeObjectURL(code){
    return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}

// 获取已经加载 vue/js 模块缓存, 返回对应 blobUrl
function getImportCache(url) {
    const blobUrl = url in _resolvedModulesBlob ? _resolvedModulesBlob[url] : [];
    if (!Array.isArray(blobUrl)) {
        return typeof blobUrl === 'string' ? Promise.resolve(blobUrl) : Promise.reject(blobUrl);
    }
    return false;
}

// 加载 js 模块, 返回对应 blobUrl
function getImportUrl(url) {
    if (url in _resolvedModulesBlob) {
        const blobUrl = _resolvedModulesBlob[url];
        if (typeof blobUrl === 'string') {
            return Promise.resolve(blobUrl);
        }
        if (Array.isArray(blobUrl)) {
            return new Promise((resolve, reject) => {
                blobUrl.push({resolve, reject})
            })
        }
        return Promise.reject(blobUrl);
    }
    _resolvedModulesBlob[url] = [];

    const reqHeaders = new Headers();
    reqHeaders.append('pragma', 'no-cache');
    reqHeaders.append('cache-control', 'no-cache');
    return fetch(url, {
        headers:reqHeaders
    }).then(res => {
        if (res.status !== 200) {
            throw 'resolve import[' + url + '] failed';
        }
        return res.text();
    }).then(code => {
        // js code 中可能还有 import 依赖
        let path = url.split('/');
        path.pop();
        path = path.join('/') + '/';
        return getCodeUrl(code, path);
    }).then(finalUrl => {
        _resolvedModulesBlob[url].forEach(({resolve}) => {
            resolve(finalUrl);
        });
        _resolvedModulesBlob[url] = finalUrl;
        return finalUrl;
    }).catch(err => {
        _resolvedModulesBlob[url].forEach(({reject}) => {
            reject(err);
        });
        _resolvedModulesBlob[url] = err;
        throw err;
    });
}

// 加载 vue 模块, 返回对应 blobUrl
function getVueImportUrl(url) {
    const blob = getImportCache(url);
    if (blob !== false) {
        return blob;
    }
    return httpVueLoader(url).then(res => {
        var code = '';
        if (res._bloburl) {
            code += "import c from '" +res._bloburl+ "';\n";
            code += 'const s = c||{};\n';
        } else {
            code += "const s = {}\n";
        }
        if (res.template) {
            code += 's.template = ' + JSON.stringify(res.template) + ";\n";
        }
        code += 'export default s;';
        const codeBlob = new Blob([code], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(codeBlob);
        _resolvedModulesBlob[url] = blobUrl;
        return blobUrl;
    })
}

// 加载 vue/js 模块, 返回对应 blobUrl (处理顺序: 模块缓存 > vue依赖 > js依赖 > 尝试自动处理依赖)
function getImportBlobUrl(url){
    const blob = getImportCache(url);
    if (blob !== false) {
        return blob;
    }
    var s = url.toLowerCase();
    if (s.endsWith('.vue')) {
        return getVueImportUrl(url);
    } else if (s.endsWith('.js') || s.endsWith('.mjs')) {
        return getImportUrl(url);
    }
    return getVueImportUrl(url + '.vue').catch((err) => {
        if (typeof err === 'object' && 'httpCode' in err) {
            return getImportUrl(url + '.js');
        }
        throw err;
    })
}

// 解析 js 代码块, 递归处理代码块中的 import 依赖, 最终转为 ObjectURL
function getCodeUrl(code, baseURI) {
    var index = 0;
    var nested = [];
    code = removeComments(code).replace(importRegex, function(matched, start, extra, src, end) {
        // 本来就是 blob 了, 不予处理
        if (src.startsWith('blob:')) {
            return matched;
        }
        // 若是导入静态资源
        if (assetsExtension.test(src)) {
            if (!extra) {
                return '';
            }
            extra = extra.trim()
            var needVars = extra.substr(0, extra.length - 'from'.length);
            return 'let ' + needVars + '= ' + '"' + getAssetRealPath(src, baseURI) + '";';
        }
        // 提取 import 以便后续处理
        const imrt = '__$VUE_IMPORT_MODULE_' + index + '__';
        nested.push({
            index, 
            src, 
            extra:extra ? extra.trim() : null, 
            code:start + '{~src~}' + end
        });
        index++;
        return imrt;
    }).replace(/requireComponent\(\s*['"]([^"')]+)['"](.*)\)/g, function(matched, name, end) {
        // 格式化异步加载组件的 url, 可加载 本地 js/vue 组件, 远程 js 组件, require 公共库组件
        if (name.startsWith('.')) {
            name = '!' + getAbsolutePath(baseURI, name);
        }
        return 'requireComponent("'+name+'"'+end+')';
    });
    // 正则未匹配到 import 依赖, 直接返回
    if (index === 0) {
        // js 代码完全为空? 那就 es6 方式导出 undefined
        if (code.trim() === '') {
            code = 'export default undefined;';
        }
        return Promise.resolve(createCodeObjectURL(code));
    }
    const nestedModules = [];
    const nestedResolve = [];
    nested.forEach(({index, src, extra, code}) => {
        const loader = (new Promise(function (resolve) {
            /**
                1. http://www  url形式, 使用 rquire 加载
                2. lib!xxx  形式, 使用 rquire 加载
                3. ./xx 相对路径形式, 加载本地依赖
                4. name  纯名称
                   a. 在 des版, 优先尝试使用 rquire 加载本地依赖, 方便修改测试依赖
                   b. 在 dev版, 直接使用 rquire
             */
            if (/^\/|:|\?/.test(src)) {
                resolve(null);
            } else if (src.startsWith('.')) {
                resolve({
                    base: baseURI,
                    src,
                })
            } else {
                if (process.env.BUILD_TYPE === 'des') {
                    const isPure = /^[0-9a-zA-Z\_\-\~\.\@]+$/.test(src);
                    if (!isPure) {
                        resolve(null);
                    } else {
                        // des 版, 组件可能是本地组件, 根据 vepanel.json 配置决定
                        fetch('./../src/packages/'+src+'/vepanel.json').then(function (res) {
                            if (res.status !== 200) {
                                return false;
                            }
                            return res.json().then(json => {
                                return 'type' in json && json.type === 'vue';
                            });
                        }).catch(() => {
                            return false;
                        }).then(r => {
                            if (r) {
                                resolve({
                                    base:'./../src/packages/',
                                    src: src + '/index',
                                });
                            } else {
                                resolve(null);
                            }
                        })
                    }
                } else {
                    resolve(null);
                }
            }
        })).then(local => {
            // 引入本地依赖, 如  import xx from './foo';
            if (local) {
                return getImportBlobUrl(getAbsolutePath(local.base, local.src)).then(function (url) {
                    nestedModules.push({index: index, url:code.replace('{~src~}', url)});
                    return url;
                });
            }
            // 引入线上依赖, 如 import Vue from 'vue';
            return new Promise(function (resolve, reject) {
                require([src], function(mod){
                    if (extra) {
                        // import xx from 'lib!xx' 形式, 转换远程组件为 blob url
                        nestedModules.push({index: index, url:code.replace('{~src~}', resolveLibImport(mod, src))});
                    } else {
                        // import 'lib!xx' 形式, 没有导出, 直接自动处理了, 替换为空
                        nestedModules.push({index: index, url:''});
                    }
                    resolve(mod);
                }, function() {
                    reject('load global ['+src+'] failed');
                });
            });
        });
        nestedResolve.push(loader);
    });
    return Promise.all(nestedResolve).then(res => {
        nestedModules.forEach(({index, url}) => {
            code = code.replace('__$VUE_IMPORT_MODULE_' + index + '__', url)
        });
        return createCodeObjectURL(code);
    });
}

// 将 import xx, * as all, {foo, bar as alias} from 'lib!xx'
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/import
// 为防止 import from 使用解构 或 别名, 将 require 得到的对象转为 es6 blob url
const reservedKeywords = ["do","if","in","for","let","new","try","var","case","else","enum","eval","null","this","true","void","with","await","break","catch","class","const","false","super","throw","while","yield","delete","export","import","public","return","static","switch","typeof","default","extends","finally","package","private","continue","debugger","function","arguments","interface","protected","implements","instanceof"];
function resolveLibImport(mod, src){
    if (!('__lib_loaded__' in window)) {
        window.__lib_loaded__ = [];
    }
    let len = __lib_loaded__.push(mod) - 1,
        objKeys = Object.keys(mod),
        defIndex = objKeys.indexOf('default'),
        code = "//"+src+"\nconst lib = __lib_loaded__["+len+"];\n";
    if (defIndex !== -1 ){
        objKeys.splice(defIndex, 1);
        code += "export default lib.default;\n";
    } else {
        code += "export default lib;\n";
    }
    // js 保留词不能直接导出
    if (objKeys.length) {
        objKeys = objKeys.filter(k => !reservedKeywords.includes(k))
    }
    if (objKeys.length) {
        const keyVars = "{"+objKeys.join(',')+"}";
        code += "const "+keyVars+" = lib;\n";
        code += "export "+keyVars+";\n";
    }
    return createCodeObjectURL(code);
}


/**
 * mock 数据
 */
class mockRes {
    constructor() {
        this.code = null;
        this.text = null;
        this.headers = {};
        this.payload = null;
    }
    status(code, text) {
        this.code = code;
        this.text = text;
        return this;
    }
    header(key, value) {
        if (typeof key === 'object') {
            this.headers = {...this.headers, ...key};
        } else {
            this.headers[key] = value;
        }
        return this;
    }
    send(payload) {
        this.payload = payload;
        return this;
    }
}

// mock 工具函数, 可内置一些比较有用的 helper 函数提供给 mock 操作
var mockUtils = null;
function getMockUtils(){
    if (mockUtils) {
        return Promise.resolve(mockUtils);
    }
    return new Promise((resolve, reject) => {
        require(['dexie'], function(dexie) {
            (async () => {
                return {
                    db: await mockUtilsDB(dexie),
                }
            })().then(utils => {
                resolve(mockUtils = utils)
            });
        }, reject);
    })
}

// 新增 Mock 所需的 Dexie 数据表
function mockUtilsDB(Dexie){
    const mockDBName = 'mockDB', 
        db = new Dexie(mockDBName);
    db.scheme = function (struct) {
        const updates = Object.keys(struct);
        if (!updates.length) {
            return Promise.resolve(false);
        }
        return (db.isOpen() ? Promise.resolve() : db.open()).then(() => {
            return db.table('_scheme').toArray().then(list => {
                const scheme = {}, 
                    tableUpdate = [],
                    tableDelete = [];
                list.forEach(item => {
                    const name = item.table, index = updates.indexOf(name);
                    if (index > -1) {
                        updates.splice(index, 1);
                        if (!struct[name]) {
                            scheme[name] = null;
                            tableDelete.push(name);
                        } else if (item.scheme !== struct[name]) {
                            scheme[name] = struct[name];
                            tableUpdate.push({
                                table: name,
                                scheme: struct[name]
                            })
                        } else {
                            scheme[name] = item.scheme;
                        }
                    } else {
                        scheme[name] = item.scheme;
                    }
                });
                updates.forEach(name => {
                    if (struct[name]) {
                        scheme[name] = struct[name];
                        tableUpdate.push({
                            table: name,
                            scheme: struct[name]
                        })
                    }
                });
                if (!tableUpdate.length && !tableDelete.length) {
                    return false;
                }
                return {
                    version: db.verno,
                    scheme,
                    tableUpdate,
                    tableDelete
                }
            });
        }).catch(() => {
            const scheme = {}, tableUpdate = [];
            updates.forEach(name => {
                if (struct[name]) {
                    scheme[name] = struct[name];
                    tableUpdate.push({
                        table: name,
                        scheme: struct[name]
                    })
                }
            });
            return {
                version: 0,
                scheme,
                tableUpdate,
                tableDelete: []
            }
        }).then(rs => {
            if (!rs) {
                return false;
            }
            const {version, scheme, tableUpdate, tableDelete} = rs;
            scheme['_scheme'] = "&table,scheme";
            db.close();
            db.version(version + 0.1).stores(scheme);
            return db.open().then(() => {
                return tableUpdate.length ? db.table('_scheme').bulkPut(tableUpdate) : null;
            }).then(() => {
                return tableDelete.length ? db.table('_scheme').where('table').anyOf(tableDelete).delete() : null;
            }).then(() => {
                return true;
            })
        })
    };
    // 创建 DB 并创建 _scheme 表
    return (db.isOpen() ? Promise.resolve() : Dexie.exists(mockDBName).then(exists => {
        if (!exists){
            db.version(0.1).stores({
                _scheme: "&table,scheme"
            })
        }
        return db.open()
    })).then(() => db)
}

// 添加 mock 数据
let mockData = {};
let mockGlobal = false;
function addMockDatas(mock) {
    let install = null;
    Object.entries(mock).forEach(([key, value]) => {
        const keys = key.split(' ').filter(item => item).slice(0, 2);
        const method = keys.length > 1 ? keys[0].toUpperCase() : '_';
        const uri = keys.length > 1 ? keys[1] : keys[0];
        // 安装钩子
        if (uri === '#') {
            install = value;
            return;
        }
        // 忽略静态数据
        if (uri.startsWith('#')) {
            return;
        }
        if (!(method in mockData)) {
            mockData[method] = {};
        }
        mockData[method][uri] = value;
    });
    if (!install) {
        return mockData;
    }
    return getMockUtils().then(utils => {
        return install(utils)
    }).then(() => {
        return mockData;
    })
}

/**
 * 可使用 Mock 数据的 fetch 函数
 */
function myFetch(request) {
    if (_disableMock) {
        return fetch(request)
    }
    return new Promise(function(resolve) {
        if (mockGlobal) {
            return resolve(mockData);
        }
        return getImportResult('mock.js').catch(() => {
            return {};
        }).then(mock => {
            mockGlobal = true;
            return addMockDatas(mock);
        }).then(resolve)
    }).then(data => {
        return {data, url:request._url.split('#')[0].split('?')[0], request};
    }).then(({data, url, request}) => {
        const method = request.method;
        const mock = 
            method in data && url in data[method] 
            ? data[method][url] 
            : ('_' in data && url in data._ ? data._[url] : null);
        if (!mock) {
            return fetch(request);
        }
        let d = mock, t = 0;
        if (Array.isArray(d) && d.length === 2 && typeof d[1] === 'number' ) {
            t = d[1];
            d = d[0];
        }
        if (typeof d !== 'function') {
            return endRequest(d, null, t);
        }
        const res = new mockRes();
        return getMockUtils().then((utils) => d(res, request, utils)).then(() => endRequest(res.payload, res, t))
    })
}
function endRequest(data, res, t) {
    const resInit = {};
    if (res) {
        if (res.code) {
            resInit.status = res.code;
        }
        if (res.text) {
            resInit.statusText = res.text;
        }
        if (res.headers) {
            resInit.headers = res.headers;
        }
    }
    const mockResponse = new Response(JSON.stringify(data), resInit);
    if (typeof t !== 'number' || t < 1) {
        return mockResponse;
    }
    return new Promise(function(resolve) {
        setTimeout(function () {
            resolve(mockResponse);
        }, t);
    });
}


/**
 * .vue 文件 template 区块
 */
class TemplateContext {
    constructor(component, content) {
        this.component = component;
        this.content = content;
    }
    compile() {
        const assetTag = {
            video: ['src', 'poster'],
            source: 'src',
            img: 'src',
            image: ['xlink:href', 'href'],
            use: ['xlink:href', 'href']
        };
        var self = this;
        Object.entries(assetTag).forEach(([tag, value]) => {
            if (Array.isArray(value)) {
                value.forEach(attr => {
                    self.assetUrl(tag, attr);
                })
            } else {
                self.assetUrl(tag, value);
            }
        });
        return Promise.resolve(); 
    }
    assetUrl(tag, att) {
        const base = this.component.baseURI;
        const pattern = new RegExp("(<"+tag+".+"+att+"\=\s*['\"]?)([^\"']+)([\"']?.+>)", "gi");
        this.content = this.content.replace(pattern, (matched, before, url, after) => {
            return before + getAssetRealPath(url, base) + after;
        });
    }
}


/**
 * .vue 文件 script 区块
 */
class ScriptContext {
    constructor(component, content) {
        this.component = component;
        this.content = content;
        this.import = null;
    }
    compile(){
        return getCodeUrl(this.content, this.component.baseURI).then(function(url) {
            this.import = url
            return this;
        }.bind(this))
    }
}


/**
 * .vue 文件 mock 区块
 */
class MockContext {
    constructor(code) {
        this.code = code;
    }
    compile() {
        if (_disableMock) {
            return Promise.resolve();
        }
        const codeBlob = new Blob([this.code], { type: 'text/javascript' });
        return getImportResult(URL.createObjectURL(codeBlob)).then(res => {
            return addMockDatas(res)
        })   
    }
}


/**
 * .vue 文件 style 区块
 */
const StyleContext_Asset = [
    /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g,
    /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g
];
class StyleContext {
    constructor(component, content, scoped, less) {
        this.component = component;
        this.content = content;
        this.scoped = scoped;
        this.less = less;
    }
    compile() {
        var self = this;
        return new Promise(function(resolve) {
            if (!self.less) {
                return resolve(self.content);
            }
            require(['less'], function(less) {
                const base = self.component.baseURI;
                var code = removeComments(self.content)
                    .replace(lessImportRegex, function(matched, start, src, end) {
                        return start + getAssetRealPath(src, base) + end;
                    });
                less.render(code, function(err, g) {
                    if (err) {
                        throw err.message + ' @['+self.component.sfcUrl+']';
                    }
                    resolve(g.css);
                })
            });
        }).then((css) => {
            return self.parse(css);
        })
    }
    parse(css) {
        const base = this.component.baseURI;
        StyleContext_Asset.forEach(pattern => {
            css = css.replace(pattern, (matched, before, url, after) => {
                return before + getAssetRealPath(url, base) + after;
            });
        });
        this.content = css;
        const elt = document.createElement('style');
        elt.appendChild(document.createTextNode(css));
        this.component.getHead().appendChild(elt);
        if ( this.scoped ) {
            this.scopeStyles(elt, '['+this.component._scopeId+']');
        }
    }
    scopeStyles(styleElt, scopeName){
        function process() {
            var sheet = styleElt.sheet;
            var rules = sheet.cssRules;
            for ( var i = 0; i < rules.length; ++i ) {
                var rule = rules[i];
                if ( rule.type !== 1 ) {
                    continue;
                }
                var scopedSelectors = [];
                rule.selectorText.split(/\s*,\s*/).forEach(function(sel) {
                    // vue scope 样式会编译为 className[scopeId] 同时会给每个需要的 html tag 标签加上 <tag scopeId/>
                    // 若这里也这样做的话, 就需要解析 style / html 树, 工程量有点大
                    // 所以这里简单点,  给组件 template 外层嵌套一个 <span scopeId> <..template../> </span>
                    // 那么 css 只需解析为  [scopeId] .className 即可

                    // 按照上面的方案, 有一种类型的样式无法解析, 比如  
                    // <div class="app-phone">   <span [scopeId]><b class="foo"></b></span>   </div>
                    // css:  .app-phone .foo{}  解析为->  [scopeId] .app-phone .foo{}
                    // 即使用组件父级 class 会导致样式无法被应用, 正确的应解析为  .app-phone [scopeId] .foo{}
                    // 但对于多层的 className 又不能统一这么处理, 因为无法确定哪个是属于外部的 className
                    // 需要手工 通过 topClassName 来设置可能的外部 className

                    // 判断是否为 topClass 的子级, 从而确定添加方式
                    var segments = sel.match(/([^ :]+)(.+)?/);
                    if (segments[1] && topClassName.includes(segments[1])) {
                        scopedSelectors.push(segments[1] + ' ' + scopeName + segments[2]);
                    } else {
                        scopedSelectors.push(scopeName+' '+sel);
                    }
                });
                var scopedRule = scopedSelectors.join(',') + rule.cssText.substr(rule.selectorText.length);
                sheet.deleteRule(i);
                sheet.insertRule(scopedRule, i);
            }
        }
        try {
            // firefox may fail sheet.cssRules with InvalidAccessError
            process();
        } catch (ex) {
            if ( ex instanceof DOMException && ex.code === DOMException.INVALID_ACCESS_ERR ) {
                styleElt.sheet.disabled = true;
                styleElt.addEventListener('load', function onStyleLoaded() {
                    styleElt.removeEventListener('load', onStyleLoaded);
                    // firefox need this timeout otherwise we have to use document.importNode(style, true)
                    setTimeout(function() {
                        process();
                        styleElt.sheet.disabled = false;
                    });
                });
                return;
            }
            throw ex;
        }
    }
}


/**
 * .vue 对象
 */
class VueComponent {
    constructor() {
        this.template = null;
        this.script = null;
        this.mock = null;
        this.styles = [];
        this.baseURI = '';
        this.sfcUrl = '';
        this._scopeId = 'data-s-' + (scopeIndex++).toString(36);
    }
    getHead(){
        return document.head || document.getElementsByTagName('head')[0];
    }
    load(componentURL){
        const reqHeaders = new Headers();
        reqHeaders.append('pragma', 'no-cache');
        reqHeaders.append('cache-control', 'no-cache');
        return fetch(componentURL, {
            headers:reqHeaders
        }).then(function(res) {
            if (res.status !== 200) {
                var error = new Error('resolve ' + componentURL + ' failed, HttpCode:' + res.status);
                error.httpCode = res.status;
                throw error;
            }
            return res.text();
        }).then(function(res) {
            /** 
            * 参考这个库, 他是用 document 方式获取的, 但这种有个问题
            * 对于非标准自闭和标签, documet 会自作聪明的在后面加一个封口标签
            * 在某些情况下, 会导致 vue 无法正确处理, 所以这里改用 正则方式
            * https://github.com/FranckFreiburger/http-vue-loader
            */
            let self = this;
            self.sfcUrl = componentURL;
            self.baseURI = componentURL.substr(0, componentURL.lastIndexOf('/')+1);

            // 在 script 标签内可能有注释, 为避免注释含有 <template> <style> 字符串
            // 影响 template/style 的正则获取, 这里获取到 script code 后, 将其从 res 中移除再进行下一步
            // 即使是这样, 对于注释中包含 tag 的仍有可能出现问题, 若想完全 ok, 要搞一个 Parser 才行
            // 考虑到这种几率已经很小了, 为保持简单, 先这样吧
            let match, mockCode, scriptCode;
            const jsRegex = /<script([^>]+)?>([\s\S]*?)<\/script>/mi;
            while(true) {
                match = jsRegex.exec(res);
                if (!match) {
                    break;
                }
                if (match[1] && match[1].indexOf('mock')>-1) {
                    mockCode = match[2];
                } else {
                    scriptCode = match[2]
                }
                res = res.substr(0, match.index) + res.substr(match.index + match[0].length)
            }
            if (scriptCode) {
                self.script = new ScriptContext(self, scriptCode);
            }
            if (mockCode) {
                self.mock = new MockContext(mockCode);
            }
            
            // styles
            let scoped, less, hasScoped;
            const styleRegex = /<style([^>]+)?>([\s\S]*?)<\/style>/gmi;
            while ((match = styleRegex.exec(res)) !== null) {
                scoped = less = false;
                if (match[1]) {
                    scoped = match[1].indexOf('scoped')>-1;
                    less = match[1].indexOf('less')>-1;
                }
                if (scoped && !hasScoped) {
                    hasScoped = true;
                }
                self.styles.push(new StyleContext(self, match[2], scoped, less));
            }

            // template
            match = res.match(/<template([^>]+)?>([\s\S]*)<\/template>/i);
            if (match) {
                var tempStr;
                // 对于使用了 scoped style 的, 必须使用包裹的方式
                var firstTag = hasScoped ? false : match[2].match(/<([^>]+)>/i);

                // 不包含 v-if, 说明就一个 root 标签
                if (firstTag && firstTag[1].indexOf("v-if") === -1) {
                    // 是否为自封口标签, 就一个组价
                    var attrs = firstTag[1].trim();
                    var selfColose = attrs.endsWith('/');
                    if (selfColose) {
                        attrs = attrs.substr(0, attrs.length - 1);
                    }
                    tempStr = '<'+attrs+' ' + this._scopeId + (selfColose ? ' /' : '') + '>' +
                        match[2].substr(firstTag.index + firstTag[0].length);
                } else {
                    // 包含多个, 想完美的话, 只能 parse 字符串, 给每个 root 标签家  scopeId
                    // 这里先简单的包裹一个 root 标签
                    tempStr = "<span "+this._scopeId+">" + match[2] + "</span>";
                }
                self.template = new TemplateContext(self, tempStr);
            }

            return this;
        }.bind(this));
    }
    compile(){
        return Promise.all(Array.prototype.concat(
            this.script && this.script.compile(),
            this.mock && this.mock.compile(),
            this.template && this.template.compile(),
            this.styles.map(function(style) { return style.compile(); })
        )).then(function() {
            return this;
        }.bind(this));
    }
}

/**
 * 加载 .vue 文件, 转为 Object 类型的 vue 组件
 */
function httpVueLoader(url) {
    if (url in _resolvedModulesObj) {
        const vueResolved = _resolvedModulesObj[url];
        if (Array.isArray(vueResolved)) {
            return new Promise((resolve, reject) => {
                vueResolved.push({resolve, reject})
            })
        }
        if (typeof vueResolved === 'object' && vueResolved.ve30) {
            return Promise.resolve(vueResolved.ve30);
        }
        return Promise.reject(vueResolved);
    }
    _resolvedModulesObj[url] = [];

    // vue 组件名不能与 html tag 名冲突, 为防止文件名刚好是 html tag 名, 这里强制加个前缀
    const cmt = new VueComponent();
    return cmt.load(url).then(function(component) {
        return component.compile();
    }).then(function(component) {
        const bloburl = component.script ? component.script.import : null;
        const template = component.template ? component.template.content : null;
        return (bloburl ? windowImport(bloburl) : Promise.resolve()).then(e => {
            const res = e ? e.default||{} : {};
            if (template) {
                res.template = template;
            }
            if (bloburl) {
                res._bloburl = bloburl;
            }
            return res;
        })
    }).then(res => {
        _resolvedModulesObj[url].forEach(({resolve}) => {
            resolve(res);
        });
        _resolvedModulesObj[url] = {ve30: res};
        return res;
    }).catch(err => {
        _resolvedModulesObj[url].forEach(({reject}) => {
            reject(err);
        });
        _resolvedModulesObj[url] = err;
        throw err;
    });
}

export {
    setLoaderConfig,
    getImportUrl, 
    getImportBlobUrl,
    getImportResult, 
    myFetch,
    httpVueLoader
};
