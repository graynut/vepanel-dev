# 二次开发

以上文档都针对默认 `vepanel` 项目，若觉得以上功能无法达到使用要求，可自行 fork [vepanel-dev](https://github.com/graynut/vepanel-dev) 进行修改，以下对该项目做个简单的说明

### 目录结构

```
└───demo    #调试网站入口
│   │
│   └───[dist]   #演示页面组件编译后保存目录
│   │
│   └───[mock]   #静态 mock 数据保存目录
│   │
│   └───view   #演示页面组件
|         page1.vue
|         page2.vue
|
|
└───docs    #文档目录
|
|
└───[packages]    #通用组件编译后的保存目录,可发布到 npm
|
|
└───src    
│   │
│   └───app    #中台整体框架
│   │
│   └───packages   #通用组件, 处理后发布到 npm
│   │
│   └───scripts    #requireJs + vepanel 核心源码, 编译后发布到 npm
│   │
│   └───vepanel    #npm vepanel 包源码，用于提供编译页面组件的命令行
│   │
│   └───build.js   #用于编译 packages/scripts 源码
│   │
│   └───server.js  #极简版 http server
|
│   
```

### 命令行

`npm run server`

启动 HTTP Server

`npm run update`

检测 /src/packages 目录下 npm|github 包是否有新版本并下载

`npm run build:app`

编译 @vepanel/vepanel 核心 js, 源码目录为 /src/app 和 /src/scripts

`npm run build:pack`

编译/复制 /src/packages 目录下的通用组件到 /packages 目录

`npm run build:demo`

编译 /demo/view 页面组件到 /demo/dist 目录

`npm run build:mock`

编译 mock 静态数据到 /demo/mock 目录

### packages

通用组件一共有三种类型：VUE 组件、纯 js 组件、第三方组件，在使用 `npm run update` 和 `npm run build:pack` 会根据类型自动选择合适的方式处理，通过 `packages/[name]/vepanel.json` 指明类型

VUE 组件，入口文件为 index.js

```json
{
    "type":"vue",
    "version":"0.0.1",
    "desc":[
        "描述，用于生成 readme.md"
    ]
}
```

纯 js 组件，入口文件为 index.js，编译时仅做 uglify 处理

```json
{
    "type":"js",
    "version":"0.0.1",
    "desc":[
        "描述，用于生成 readme.md"
    ]
}
```

第三方组件

```json
{
    "type":"npm",
    "package":"element-ui",
    "version":"2.13.2",
    // 指定要提取的文件, 在执行 update 命令时, 会自动下载最新版并提取文件
    "files":{
        "index.js": "lib/index.js",
        "theme.css": "lib/theme-chalk/index.css",
        "fonts/element-icons.ttf": "lib/theme-chalk/fonts/element-icons.ttf",
        "fonts/element-icons.woff": "lib/theme-chalk/fonts/element-icons.woff"
    },
    "desc":[
        "移除 define 中强制指定的命名",
        "移除了 source map 注释",
    ]
}

// 也可指定为 github 上的项目, version 为 github 上对应 release 版本
{
    "type":"github",
    "package":"malacca/kindeditor",
    "version":"0.0.7",
    "files":{
    },
    "desc":[
    ]
}
```