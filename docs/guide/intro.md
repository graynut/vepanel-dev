# 前言

在 JQuery 的时代，一般使用 js 直接操作 html dom 节点，需 html / css / js 代码配合来达成目的，维护起来十分不便。众多的前端开发人员也开始尝试组件化，比如特别常见的幻灯片组件，这种组件库一般自带 html/css，在分享时比较方便，只需引入 js，按照其使用方法调用即可。

[Vue](https://cn.vuejs.org/index.html) 与 [React](https://zh-hans.reactjs.org/)、[Web_Components](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components) 等框架强化了这种组件化的方案，通过虚拟 DOM 或其他技术手段设定了一个规范，允许开发者根据规范来封装具有通用性之的模块。这个模块具有独立性，非常类似于桌面软件中的控件，拥有私有的模板、样式、交互API等，还会提供一些可配置的属性 (props) 灵活的控制UI；甚至还有一些组件，仅提供 API ， 比如 [Vue Router](https://router.vuejs.org/zh/)，就可以理解为这样一种特殊组件。

这样前端在实现具体页面时，只需选用合适的组件进行组合拼装即可；理论上讲，页面本身也是一个组件，在这种开发模式下，一切皆组件。


## 项目目的

那么问题来了，VUE 提供了控件规则和运行环境，但其本身并不直接提供控件，如何获取使用控件？

官方提供了 [vue cli](https://cli.vuejs.org/zh/) 作为脚手架：使用 npm 做组件依赖管理 -> webpack 做打包、版本控制、资源处理 -> 当需要控件时，npm 安装， import 引入。开发过程中还可以自动刷新、状态保持。一切都很棒了，为啥还要造轮子？

`vepanel` 的目的是用于快速搭建中后台，讲究一个快，可以配合服务端快速完成管理界面，`vue cli` 模式存在以下不方便：

1. 开发或修改任何功能，都要 clone 整个项目，并且要装成吨的 npm 依赖，哪怕只改一行代码，都要跑完整个流程。
2. 不同项目的控制台使用相同的页面，比如有那么一个表单，两个项目完全相同，那么两个项目间分享这么一个页面不是很方便。
3. 增加学习负担，除项目本身外，还要了解学习 `cli` 相关的配置，使用方法。

最终期待达成目的

1. 一个 .vue 文件就是一个功能页面，无需 node / npm 环境，可直接运行。
2. 提供基本的中后台框架，并提供一些全局通用的基本方法。


## 实现思路

研究一下 `vue cli` 生成的代码，其利用了 [路由懒加载](https://router.vuejs.org/zh/guide/advanced/lazy-loading.html)，最终生成 3 种类型的文件

1. vender js：  包含 vue 本身和其他公用模块
2. app js： 包含自动生成的路由配置和首页组件
3. page js： 除首页外的其他页面组件， 请求不同 uri 时加载对应 js

对应的方案
    
1. vender js：可直接使用 [vue cdn](https://cn.vuejs.org/v2/guide/installation.html#CDN) 文件，
2. app js：自动配置路由，且可以直接加载 .vue 文件类型的页面组件，也可以加载页面组件编译后的 js 文件。
3. page vue： 页面组件，可提供 .vue 文件，也可提供一个编译过的 js 文件

> 本项目要实现的是 `app js`，这样就只需编写 `page vue` 即可，无需安装任何依赖，直接在浏览器运行；
> 另外还应提供一个将 `page vue` 转为 `page js` 的功能，这样在生产环境下，就可以使用 runtime 的 `vue cdn` 以减小体积、增强兼容性、提升性能。

如果你想马上开始你的项目，请阅读 [快速开始](start.md)，如果你想了解更多细节，请阅读 [二次开发](design.md)
