(function() {
    var markedVer = '1.1.1',
        prismVer = '1.21.0'
        baseUrl = 'https://cdn.jsdelivr.net/';
    requirejs.config({
        paths: {
            marked: baseUrl + 'npm/marked@'+markedVer+'/marked.min',
            prismjs: baseUrl + 'npm/prismjs@'+prismVer+'/prism.min'
        },
        onNodeCreated: function(node, config, module, path) {
            if (module === 'prismjs') {
                node.setAttribute('data-manual', '');
            }
        }
    });

    /* 定义 requirejs prism 插件, require(['prism!php'], success => {})
       (可使用 php 测试依赖是否自动加载)
    --------------------------------------------------*/
    var PrismComponents, 
        PrismComponenting,
        PrismComponentsCb = [];
    function getPrismComponents(cb){
        if (PrismComponents) {
            cb(PrismComponents);
            return;
        }
        if (PrismComponenting) {
            PrismComponentsCb.push(cb);
            return;
        }
        PrismComponenting = true;
        fetch(baseUrl + 'npm/prismjs@'+prismVer+'/components.json').then(function(r){
            return r.json()
        }).then(function(res) {
            var components = {}, alias = {}, item, k, preCb;
            for (k in res.languages) {
                item = res.languages[k];
                components[k] = item.require ? (Array.isArray(item.require) ? item.require : [item.require]) : null;
                if (!item.alias) {
                    continue;
                }
                if (Array.isArray(item.alias)) {
                    item.alias.forEach(function(a){
                        alias[a] = k
                    })
                } else {
                    alias[item.alias] = k
                }
            }
            for (k in alias) {
                if (!(k in components)) {
                    components[k] = alias[k];
                }
            }
            PrismComponents = components;
            while(preCb = PrismComponentsCb.shift()) {
                preCb(PrismComponents);
            }
            cb(PrismComponents);
        })
    }

    function normalize(name) {
        var index = name.indexOf('?');
        return index > -1 ? name.substr(0, index) : name;
    }

    function isHaveLang(lang) {
        return lang in Prism.languages && typeof Prism.languages[lang] === 'object'
    }

    function langUrl(lang) {
        return baseUrl + 'npm/prismjs@'+prismVer+'/components/prism-'+lang+'.min.js';
    }

    define('prism', {
        normalize: normalize,
        load: function(name, req, onLoad, config) {
            // prismjs 自动释放全局变量 Prism
            req(['prismjs'], function() {
                if (isHaveLang(name)) {
                    onLoad(true);
                    return;
                }
                getPrismComponents(function(components) {
                    if (!(name in components)) {
                        onLoad(false);
                        return;
                    }
                    var load = function(){
                        req([langUrl(name)], function() {
                            onLoad(true)
                        }, function() {
                            onLoad(false)
                        });
                    };
                    var deps = components[name];
                    if (deps && typeof deps === 'string') {
                        deps = components[deps];
                    }
                    if (deps) {
                        req(deps.map(langUrl), load, function() {
                            onLoad(false)
                        })
                    } else {
                        load();
                    }
                })
            })
        }
    });

    /* 定义 requirejs md 插件
       require(['md!file.md[#urlPath]'], success => {})
    ----------------------------------------*/
    define('md', {
        normalize: normalize,
        load: function(name, req, onLoad, config) {
            var path = '';
            if (name.indexOf('#') > -1) {
                path = name.split('#');
                name = path[0];
                path = path[1];
            }
            fetch(name).then(function(res) {
                return res.text();
            }).then(function(md) {
                markd(md, onLoad, path)
            })
        }
    });

    /* 快捷函数
    ----------------------------------------*/
    // 高亮代码
    function highlight(code, cb, lang){
        lang = lang||"markup"
        require(['prism!'+lang], function(ok) {
            try {
                if (ok) {
                    code = Prism.highlight(code, Prism.languages[lang], lang);
                }
            } catch (e) {
                //do
            }
            cb(code, lang);
        })
    }

    // markdown 转 html
    function markd(md, cb, path){
        require(['marked'], function(Marked) {
            var markedCodes = [];
            var renderer = new Marked.Renderer();
            renderer.code = function (text, lang) {
                var len = markedCodes.length;
                markedCodes.push([lang||"markup", text]);
                return '___Marked_Code_PlaceHolder__$' + len + "\n";
            };
            renderer.link = function(href, title, text) {
                title = title ? ' title="'+title+'"' : '';
                var target = '';
                if (!/\.md$/i.test(href)) {
                    target = ' target="_blank"';
                } else {
                    href = _getMdLink(path, href.substr(0, href.length - 3));
                }
                return '<a'+target+' href="'+ href +'"'+title+'>' + text + '</a>';
            }
            var html = Marked(md, {renderer: renderer});
            _resolveCodes(html, markedCodes, cb);
        });
    }

    // 获取 md 内部链接地址
    function _getMdLink(path, relative) {
        var stack = path.split("/"),
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
        return '#' + stack.join("/");
    }

    // 处理 md 中的代码高亮
    function _resolveCodes(htm, markedCodes, callabck) {
        var resolved = [];
        var replace = function(){
            resolved.forEach(function(item, index) {
                var lang = item[1];
                lang = ' class="language-' + lang + '"';
                htm = htm.replace(
                    '___Marked_Code_PlaceHolder__$'+index, 
                    '<pre' + lang + '><code' + lang + '>' + item[0]  + '</code></pre>'
                )
            });
            callabck(htm);
        };
        var resolve = function() {
            var item = markedCodes.shift();
            if (!item) {
                replace();
            } else {
                highlight(item[1], function(code, lang) {
                    resolved.push([code, lang]);
                    resolve();
                }, item[0])
            }
        };
        resolve();
    }

    /* 应用
    --------------------------------------------------*/

    // 在指定的 elm 容器内插入 md 文档
    function insertMd(elm, baseUrl, md) {
        var lastIndex = md.lastIndexOf('/');
        var url = baseUrl + '/' + md + '.md' + (lastIndex>-1 ? '#'+md.substring(0, lastIndex + 1) : '');
        elm.style.opacity = '.6';
        require(['md!'+url], function(htm) {
            elm.innerHTML = '<div class="markd">'+htm+'</div>';
            elm.style.opacity = '';
            window.scrollTo(0, 0)
        })
    }

    // 菜单分组的折叠与展开
    function bindMenuGroup(elm){
        elm.querySelectorAll('.group').forEach(function(item) {
            var ul = item.parentNode;
            item.addEventListener('click', function() {
                ul.className = ul.className==='' ? 'open' : '';
            })
        })
    }

    // 绑定 md 链接点击事件、监听 hash 变化、 并根据 hash 载入第一个文档
    function bindMdLink(baseUrl, mdElm){
        var matches = document.querySelectorAll('[md]'),
            len = matches.length;
        var currentMd, allElm = {}, firstMd = (function(){
            var first;
            for (var k=0; k<len; k++) {
                (function(i) {
                    var elm = matches[i],
                        md = elm.getAttribute('md'); 
                    elm.addEventListener('click', function() {
                        location.hash = md
                    });
                    if (md in allElm) {
                        allElm[md].push(elm);
                    } else {
                        allElm[md] = [elm]
                    }
                    if (!first){
                        first = md;
                    }
                })(k);
            }
            return first;
        })();
        var initMd = function(){
            var md = location.hash;
            md = md ? md.substr(1) : firstMd;
            if (currentMd) {
                if (currentMd === md) {
                    return;
                }
                if (currentMd in allElm) {
                    allElm[currentMd].forEach(function(elm) {
                        elm.className = elm.className.split(' ').filter(function(c) {
                            return c != 'active'
                        }).join(' ')
                    })
                } else {
                    currentMd = null;
                }
            }
            if (md && md in allElm) {
                allElm[md].forEach(function(elm) {
                    elm.className = elm.className + (elm.className === '' ? '' : ' ') + 'active';
                })
                currentMd = md;
                insertMd(mdElm, baseUrl, md);
            } else if (md) {
                location.hash = '';
            }
        }
        window.addEventListener("hashchange", initMd, false);
        initMd();
    }

    // 浏览器运行
    function runInBrowser(){
        bindMenuGroup(document.querySelector('.menu'));
        bindMdLink('docs', document.querySelector('.content'));

        // 当前模板在手机版状态下, 菜单的折叠与展开
        var doc=document, body = document.body;
        doc.querySelector('.menu').addEventListener('click',function(ev){
            ev.stopPropagation();
        })
        doc.querySelectorAll("[toggle],.menu [md]").forEach(function(elm) {
            var className = elm.getAttribute('toggle')||'';
            elm.addEventListener('click', function(){
                body.className = body.className === '' ? className : '';
            })
        })
    }

    runInBrowser();
})();