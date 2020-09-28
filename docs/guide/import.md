# 模块引用

目前仅支持 ES2015(ES6) 模块，且开发版只能在支持该模块的浏览器运行，生产版无此要求；
先看下 ES6 引用模块的常见方式

```js
// 导入本地 css
import './index.css';

// 导入 npm package css
import 'element-ui/lib/theme-chalk/index.css';

// 导入本地文件
import Foo from './foo';

// 导入 npm package
import Vue from 'vue';
import ElementUI from 'element-ui';
Vue.use(ElementUI);

// 还有解构式导入
import {Foo, Bar} from './utils';
import * as untils from './utils';
```
`VePanel` 的方式：

  1. 使用相对路径，导入本地文件，这点与 ES6 完全相同；
  2. 使用模块名导入 npm package，使用 `requireJs` 代替 `import` 加载线上文件（这样就无需依赖 `node.js` 了）

`requireJs` 默认是按照 AMD 规范加载文件的，先看下规则：

```js
import 'name'  
->   require(['name'])   
->   request: $baseUrl / name.js

import 'name/sub'  
->   require(['name/sub'])   
->   request: $baseUrl / name / sub.js

//那么 `baseUrl` 下的文件结构就应该如下：

└─── name.js
└─── name
|     └─── sub.js
└─── name2.js
└─── name2
|     └─── sub.js
```

这样的结构不利于管理，且 `requireJs` 默认还不支持 CSS 加载，所以对其进行了修改，且已默认集成到 `vepanel` 中，按照如下规则加载且支持 CSS

```js
// 配置 requierJs, 新增 baseName 参数
requirejs.config({
    baseUrl:"http://mysite.com/",
    baseName: "index"
});


// 导入模块, 请求 url 由启动配置的 baseName 决定
import 'name'  
->   require(['name'])   
->   request: $baseUrl / name   //不指定 baseName (默认)
->   request: $baseUrl / name / $baseName.js  //指定 baseName

// 导入子文件夹 js, 可省略 .js 后缀
import 'name/sub'  
->   require(['name/sub'])   
->   request: $baseUrl / name / sub.js

// 导入 css, 必须指明 .css 后缀
import 'name/theme.css'  
->   require(['name/theme.css'])   
->   request: $baseUrl / name / theme.css

//那么 `baseUrl` 下的文件结构就应该如下：

└─── name
|     └─── $baseName.js
|     └─── sub.js
|     └─── theme.css
└─── name2
|     └─── $baseName.js
|     └─── sub.js
```

这样文件结构就与 `node_modules` 类似了，只需将 `npm package` 的主文件以  `$baseName.js` 为名保存到模块根目录，相当于维护一个线上的 `node_modules`；
最后设置 `requireJs` 的 `baseUrl`，就可以像 ES6 那样引用 `npm package` 了，完全与正常编写 SFC 相同；为什么还需要 `baseName` 参数，请往下看


## 公共库

感谢 [jsdelivr](https://www.jsdelivr.com/) (👍 支持国内) 和 [unpkg](https://unpkg.com/) （国内镜像：[zhimg](http://unpkg.zhimg.com/)、[elemecdn](http://npm.elemecdn.com/)） 提供了这么给力的 CDN，可自动索引 npm package 并提供 cdn url， 其规则为 

```js
//加载默认文件
https://cdn.jsdelivr.net/npm/element-ui

//加载指定文件
https://cdn.jsdelivr.net/npm/element-ui/lib/theme-chalk/index.css
```

可以看到模块主文件的 url 是没有 `baseName` 的，这也就是为啥会新增 `baseName` 参数，使用示例：

```js
// 这样就可以愉快的导入任何 npm 模块了
requirejs.config({
    baseName:null,
    baseUrl:"//cdn.jsdelivr.net/npm/"
});

// 并且 baseUrl 支持设置多个, 会按照顺序尝试不同镜像, 这样可以自建 cdn 作为 fallback, 避免公共库不稳定
// 自建 cdn 一定要保持目录一致性, 且注意 baseName 也要对应
requirejs.config({
    baseUrl:["//cdn.jsdelivr.net/npm/", "https://unpkg.com/", "http://mysite.com/"]
});

// 也可以完全使用自建库, 指定 baseName (这样可以完全静态存储), 当然也可以不指定, 只要满足要求即可
requirejs.config({
    baseUrl:"http://mysite.com/",
    baseName: "index"
});
```

看起来很完美，但实际使用也有问题，比如有些 npm package 不符合 AMD 规范、或没有进行压缩、或者有其他无法满足需求的，如果想完美利用公共库，可以自行在 [NPM](https://www.npmjs.com/) 创建一个组织，比如我这里弄了个例子 [VePanel Packages](https://www.npmjs.com/org/vepanel) 收集一些 vue package（`VePanel` 的默认 `baseUrl`），这样只需将 `baseUrl` 设置为：

```js
//这样虽不能随意导入任意 npm 模块，只能导入该路径下的包，但可控性更强一点
requirejs.config({
    baseUrl:"//cdn.jsdelivr.net/npm/@vepanel/"
});
```

***注意：公共库可能会更新版本，所以直接使用公共库时，为避免 break change, 可锁定版本，如***

```js
// 该 URL 为永久固定的，js 内容不可篡改
import 'name@1.0.2' 
->   require(['name@1.0.2'])   
->   request: https://cdn.jsdelivr.net/npm/name@1.0.2

// 不指定版本，会引用最新版本的 package，可能会导致不兼容
import 'name'  
->   require(['name'])   
->   request: https://cdn.jsdelivr.net/npm/name
```


## 配置式加载

在公共库找不到需要的模块或者模块有问题，可以在启动配置中 提前配置 paths，这样就可以正常引用了，如

```js
requirejs.config({
    paths:{
        "ELEMENT": ["https://cdn.jsdelivr.net/npm/element-ui@2.13.2/lib/index.js"]
    },
});


// 在组件内可正确引用
import Element from "ELEMENT";
```


## 直接引用

不想修改配置？ 支持直接使用 url 导入的

```js
// 可直接使用完整 url, 不会自动添加 .js 后缀, 原样加载
import from '//cdn.jsdelivr.net/npm/blabla/theme.css';
import vueawesome from '//cdn.jsdelivr.net/npm/vue-awesome';
import vuelidate from '//cdn.jsdelivr.net/npm/vuelidate@0.7.5/dist/vuelidate.min.js';
```

## 自定义库

直接引用比较灵活，但 url 太长了，所以 requireJs 配置新增 `alias` 参数，可自定义多组线上资源库

```js
// 同样的, 自定义库也可指定多个 url, 后面的将作为前面 url 加载失败的 fallback
requirejs.config({
  alias:{
    // 与默认 config.baseName 相同, 以数组形式设置 url 即可
    foo:["url/", "fallback/"],
    
    // 与默认 config.baseName 不同, 可重新指定
    npm:{
        baseName:null,
        baseUrl: ["//cdn.jsdelivr.net/npm/", "//unpkg.com/", "./fallback/"]
    },
  }
});

// 与使用默认的公共库使用方式完全一致，只需在前面加上别名即可；只是 baseUrl 会替换为 alias 设置的 url
import name from 'foo!name';
import element from 'npm!element-ui';
import vuedraggable from 'npm!vuedraggable@2.24.1/vuedraggable.umd.min';
import 'npm!element-ui/theme.css'  
```

## 引用名

使用方式：`name![forceName:]url[;alias]`

使用 url 加载模块的功能，会碰到一些奇怪的 AMD 模块，比如 [element-ui](https://cdn.jsdelivr.net/npm/element-ui@2.13.2/lib/index.js)，虽然符合 AMD 规范，但却强制指定了 require 的 name 必须是 `ELEMENT`，想正确引用，就要如下方法

```js
// 在启动配置中 提前配置 paths
requirejs.config({
    paths:{
        "ELEMENT": "https://cdn.jsdelivr.net/npm/element-ui@2.13.2/lib/index"
    },
});


// 在组件内可正确引用
import Element from "ELEMENT";
```

但这样就必须修改全局配置，提前定义 `paths`；有些时候只是局部使用，并不希望改动全局配置，那么就可以使用该拓展了：

```js
// 这样既可强制 引用模块 的 name 为 ELEMENT
import Element from "name!ELEMENT:http://element_url";
```

再来说说 `name![forceName:]url[;alias]` 中 `alias`，看一下 [vuedraggable](https://cdn.jsdelivr.net/gh/SortableJS/Vue.Draggable@2.23.2/dist/vuedraggable.umd.js) ，其代码开头为  `define(["sortablejs"], factory);` 

可知道其依赖 `sortablejs`， 同理的，我们可以使用 `requirejs.config` 配置  `sortablejs` 的 `path`；若不想配置，就可以使用该拓展，引用成功后，会自动挂载 `alias` 别名到 requireJs 中，这样就可以加载将 `alias` 作为依赖的模块了

```js
import "name!https://cdn.jsdelivr.net/gh/SortableJS/Sortable@1.10.2/Sortable.js;sortablejs";

import Vuedraggable from 'https://cdn.jsdelivr.net/gh/SortableJS/Vue.Draggable@2.23.2/dist/vuedraggable.umd.js';
```

聪明的你一定看出来了， name 前后其实都是为模块指定别名，之所以弄了两个，是怕像 `sortablejs` 这样即作为其他组件的依赖，又像 `element-ui` 那样强制了 name 名，有两个别名才能应对。


## 顺序加载

使用方式：`last!url1,url2,url3`

接着使用上面的例子，实际测试就会发现 `Vuedraggable` 导入失败，这是因为在 requireJs 中加载不同模块是并发进行的，并没有先后顺序，所以 `Vuedraggable` 可能在 `sortablejs` 还没准备完毕的情况下加载，自然就获取失败了，下面的方式就可以正确导入了

```js
import Vuedraggable from 'last! name!sortablejs_url;sortablejs, vuedraggable_url';
```

使用该拓展，`import` 返回的对象为最后一个 url 的引入的模块，前面的 url 仅作为依赖被加载，不会返回。 url 可以为任何 requireJs 可加载的地址，比如 `ELEMENT` 是需要 css 的，就可以按照下面的方式，以确保 css 会在 js 加载前引入。

```js
import Element from 'last! element-ui_url/theme.css, name!ELEMENT:element-ui_url';
```

> 如果依赖（比如上面的 `sortablejs`） 在配置的资源库或 paths 中，直接 `import Vuedraggable from 'vuedraggable'` 即可自动加载依赖，且保证加载顺序，无需这么麻烦


## 写在最后

`VePanel` 引用模块的方式与 ES6 的语法完全一样，但因为是线上模块，所以额外提供了一些拓展手段，方便引用，导致使用时可能出现如下代码

```js
import Lib from 'lib';  
import Lib from 'lib@version';  

import Lib from 'alias!lib';  
import Lib from 'alias!lib@version';  

import Lib from 'name!NAME:lib@version';
import Lib from 'name!NAME:alias!lib@version';

import Lib from 'last:lib/theme.css,lib@version';
```

看起来好像有点乱，如果希望像传统形式那样，只出现 `import Lib from 'lib'` 格式的代码，
那就需要在配置的 `paths` 中维护一份类似于 `package.json dependencies` 的依赖列表，以便于指明 url 并锁定版本

```js
requirejs.config({
    paths:{
        "foo": ["https://url/index@1.0.js"],
        "bar": ["https://url/index@2.0.js"],
    },
});
```

这样做，就不会出现各种奇怪的引用方式了，项目就尽可能的与 `vue cli` 开发模式的生态做到了兼容，但却不太符合 `VePanel` 的初衷，
所有依赖都要提前配置，每个页面组件无法灵活自控，不推荐使用这种方式。