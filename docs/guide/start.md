# 快速开始

### 一、下载

 - 直接 [下载 VePanel](https://github.com/graynut/vepanel/archive/master.zip) 压缩包后解压 
 - 或通过 `git clone https://github.com/graynut/vepanel.git` 拉取项目（需已安装 [git](https://git-scm.com/) ）

### 二、启动
 - 将下载的文件夹放到服务器环境下，IIS/Apache/Nginx等皆可
 - 也可安装 [Node.js](https://nodejs.org/zh-cn/)（已安装请略过），在文件夹下执行 `npm run server` 启动服务器 [推荐]
 - 访问项目目录下的 `dev.html` 开始调试

### 三、编译
 - 调试完成后，将页面组件编译为 vue runtime 组件
 - 步骤：`npm i` 安装依赖，`npm run build` 编译页面组件
 - 访问项目目录下的 `index.html` 预览生产版


## 目录结构

下面对目录结构做个说明

```
└───dev.html     #开发版 访问入口
|
└───index.html   #生产版 访问入口
|
└───loader.js    #启动配置
|
└───mock.js      #全局模拟数据
|
└───view    #开发页面组件目录
|     └─── page1.vue
|     └─── page2.vue
|     └─── .....
|
└───dist    #生产版页面组件编译目录
```


### 一、dev.html / index.html

这两个 html 即是访问中后台的入口文件，默认已设置好，可进行修改

```html
<head>

    <!-- 
      src: vepanle js (dev.js 或 app.js)
      conf: 启动配置的 url, 可缺省
    -->
    <script defer async="true"
      src="https://cdn.jsdelivr.net/npm/@vepanle/vepanel/dev.js"
      conf="./loader.js"
    ></script>

</head>

<body>
  
  <!--非必须，请求api会显示该 bar, 保持 id 不变, 可自行设计样式；若无，则加载时不显示 bar-->
  <div id="progress-wrap"><div id="progress-bar"><i></i></div></div>

  <!--非必须，在 requireJs 和 vepanelJs 加载时的 loading-->
  <!--保持 id 不变，会被自动提取为 vue 组件，用于页面组件加载时的 loading-->
  <div id="app_loader"></div>

  <!--必须, 框架总 dom -->  
  <div id="app"></div>

</body>
```


### 二、loader.js

启动配置文件，可进行一些初始化操作

```js
(function() {

    // 可选: 设置 requireJs 参数
    requirejs.config({
        baseUrl:"",
        paths:{
            "vue-star": ['//cdn.jsdelivr.net/npm/vue-stars']
        },
        ....

        // 新增 requireJs 参数, 在 [模块引用] 章节有说明
        baseName: null,  // 模块默认名称
        alias:{},        // alias 别名配置
    });




    // 可选: 可仅返回 vepanel 参数，也可进行一些其他操作，参见下面
    // define(function(){
    //     return {}
    // })

    // 设置 vepanel 参数，并 加载自定义css, 注册全局组件
    define(['vue', 'css!//at.alicdn.com/t/font_1668973_3pzet4s6hjs.css'], function(Vue) {
      
        // 注册全局组件, 在页面组件可直接使用
        Vue.component('VueStar', function (resolve) {
            require(['vue-star'], resolve)
        })

        // 返回 vepanel 参数, 整不明白也没关系，下面章节会有解释
        return {
            // 是否使用 vuex
            useVuex: false,

            // 路由模式
            routerMode: 'hash',

            // 页面组件 url prefix, 不指定则自动获取
            pageUrl: require.vepanel === 'app' ? 'dist/' : 'view/',

            // 是否禁用 mock 数据 (在 product 模式下本来就是禁用的, 该配置无效)
            disableMock: false,

            // 请求后端 api 是否携带 cookie, (空|none: 不携带, same-origin|no-cors|cors|navigate 携带方式)
            // 关于携带方式, 可参考: https://developer.mozilla.org/zh-CN/docs/Web/API/Request/mode
            cookieMode: 'cors',

            // 内置 fetch 函数请求的 api prefix
            apiUrl: 'mock',

            // 是否需要登陆检测
            auth: true,

            // 登录/退出 接口 api 地址, 最终 API 地址为 apiUrl/login 组合而成
            // 若不需要自动添加 apiUrl, 可直接设置为绝对地址, 如  login: "/login"
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
    })

})()
```


### 三、mock.js

全局可用的模拟数据，这里不再过多说明，请参考 [模拟数据](mock.md)

### 四、view / dist

- `view` 为项目目录，存放 .vue [SFC](https://cn.vuejs.org/v2/guide/single-file-components.html) 页面组件，访问 `dev.html` 可进行调试；
- `dist` 存放编译后文件，访问 `index.html` 预览。 