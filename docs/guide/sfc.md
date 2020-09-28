# 页面组件

对 `vue` 有了解的话，一定知道 [SFC](https://cn.vuejs.org/v2/guide/single-file-components.html) 文件（如下方示例结构），这样的文件就是后台的具体页面了，只需放到 `view` 目录下，如果还不熟悉，请参阅 [快速开始](start.md) 章节

```html
<template>
  <div class="app-main">
    <p class="greeting">{{greeting}}</p>
  </div>
</template>

<script>
export default {
  data () {
    return {
      greeting: 'Hello'
    }
  }
}
</script>

<style scoped>
.greeting{
  color:red;
}
</style>
```

页面组件写好了，只需要在 `menus` 接口中返回其对应菜单即可（参阅 [登陆验证](auth.md)），假设我们将上述文件保存为 `views/test.vue`，
那么 `menus` 只需添加如下菜单，此时刷新后台看一下，就可以查看该页面

```json
[
  {
    menus:[
        {
          name: '测试菜单',
          link: '/test',
          [icon: ''],
        },
    ]
  }
]
```


## 映射关系

菜单栏是由 `menus` 数据创建的，为了省去配置，统一采用约定式路由，默认映射关系如下：

    link: /path/*  ---> page: ${pageUrl}/path.[vue|js] 
    (开发版加载 .vue；生产版加载 .js；其中 `${pageUrl}` 在 `loader.js` 中配置)

规则： `link` 链接的第一段 path 作为加载文件名，如果 `link` 是 `path/foo/bar?something` 也是加载 `path.vue`。

若执行单一任务，比如上面的 `test.vue`，很简单；但有时需要一个文件处理多个任务，比如一个博客管理组件：

  - 查看当前所有博客文章列表：`/blog/list`
  - 新增一篇新博客：`/blog/add`
  - 修改博客：`blog/edit`
  - 处理博客评论：`blog/comment`

我们只能通过 `blog.vue` 一个文件来处理，可以像下面这样

```html
<template>
  <component :is="path" />
</template>

<script>
// 导入子组件
import list from './blog/list';
import add from './blog/add';
import edit from './blog/edit';
import comment from './blog/comment';

const components = {
    list,
    add,
    edit,
    comment,
};
export default {
  components,
  data(){
    return {
        path: null
    }
  },
  watch: {
    // 监听路由变化 且 载入页面就触发
    '$route': {
        handler: '$_onRouterChange',
        immediate: true
    }
  },
  methods:{
    $_onRouterChange(to){
        // 一级 path 不匹配, 不处理
        if (!to.name || to.name !== 'blog') {
            return;
        }

        // 获取 url 的二级 path
        const secondPath = to.params.pathMatch.indexOf('/') > -1
            ? to.params.pathMatch.split('/')[1]
            : null;

        // 未指定二级 path 或 指定的二级 path 组件不存在
        if (!secondPath || !(secondPath in components)) {
            this.$router.replace(to.meta.uri + '/list'); //跳转到默认页
            //this.$admin.error(404); //也可直接显示404页面
            return;
        }

        // 显示子组件
        this.path = secondPath;
    },
  }
}
</script>
```

功能完成了，在生产环境 `blog.vue`、`blog/add.vue` ... 共 5 个文件会被统一编译到 `blog.js`，这样就完成了一个文件处理多个链接的需求；
但这里有个问题，如果每个子路径组件体积都比较大，甚至子路径还有子路径，最终的 `blog.js` 体积就会比较大，能不能每个子路径也懒加载呢？

答案是可以的：

```html
<script>
// 导入子组件， 这部分不要了
// import list from './blog/list';
// import add from './blog/add';
// import edit from './blog/edit';
// import comment from './blog/comment';

// 改为异步组件
const components = {
    list: () => requireComponent('./blog/list', true),
    add: () => requireComponent('./blog/add', true),
    edit: () => requireComponent('./blog/edit', true),
    comment: () => requireComponent('./blog/comment', true),
};

//......
</script>
```

其中 `requireComponent`([全局 API](api.md)) 是 `VePanel` 提供的创建异步组件的全局 API，这样子组件会分开编译，异步加载。


## 编译规则

先看下方的文件结构示意

```
|
└───view    #开发版页面组件
|     └─── page.vue
|     └─── Foo.vue
|     └─── blog.vue
|     └─── blog
|           └─── add.vue
|           └─── edit.vue
|           └─── ....

```

编译安装以下规则
1. 默认仅编译 `view` 根目录的 .vue 文件，所以 `blog` 下文件会与 `blog.vue` 合并
2. 如果检测到子目录 .vue 文件被当做异步组件使用，那么就会进行编译
3. 首字母为大写的 .vue 文件不会编译，比如上面 `Foo.vue` 是 `page.vue` 的子组件，首字母大写就能跳过编译了

最终编译结果

```
# blog 不使用异步组件                   # blog 使用异步组件
|                                    |
└───dist                             └───dist   
|     └─── page.js                   |     └─── page.js
|     └─── blog.js                   |     └─── blog.js
                                     |     └─── blog
                                     |           └─── add.js
                                     |           └─── eidt.js
                                     |           └─── ...
```

## 样式 (style)

这个是与 `vue cli` 非常不同的一点， 其支持多种 css 预编译，而 `VePanel` 仅支持 [Less](http://lesscss.org/)，其他与之相同，也支持 `scoped` 私域样式。

```html
<style>
/*全局 css*/
.foo{color:red}
</style>

<style scoped>
/*私域 css*/
.foo{color:red}
</style>

<style lang="less">
/*全局 less*/
@color: red;
.foo{color:@color}
</style>

<style lang="less" scoped>
/*私域 less*/
@color: red;
.foo{color:@color}
</style>
```

## 静态资源

在 SFC 文件中可能会使用一些静态资源，如 图片/SVG 什么的，与 `vue cli` 的使用方式一致：

- 支持相对路径：如 `./../asset/foo.png`
- 支持绝对路径：以 `@` 开头，如 `@/asset/foo.png`，`@` 代表 `view` 目录。
- 支持 `node_modules`： 以 `~` 开头，如 `~/package/foo.png`，`VePanel` 初衷是为了摆脱 `node` 进行调试，所以虽支持但不推荐该形式

```html
<template>
  <div class="app-main">
    <img src="./asset/vue.png">
    <img src="@/asset/vepanel.png">
    <img src="~/vepanel/logo.png">

    <img :src="foo">
    <img :src="bar">
    <img :src="biz">

    <div class="foo">
    <div class="bar">
    <div class="biz">
  </div>
</template>

<script>
import foo from "./asset/vue.png";
import bar from "@/asset/vepanel.png";
import biz from "~/vepanel/logo.png";
export default {
  data () {
    return {
      foo,
      bar,
      biz
    }
  }
}
</script>

<style scoped>
.foo{
  background:url("./asset/vue.png")
}
.bar{
  background:url("@/asset/vepanel.png")
}
.biz{
  background:url("~/vepanel/logo.png")
}
</style>
```


## 模拟数据 (mock)

这是一个新增的功能，可以在 SFC 中定义 Mock 区块，设置模拟数据，数据格式的说明参见 [模拟数据](mock.md)

```html

<script mock>
export default {

  '/api/foo': {

  },

  '/api/bar': () => {

  }

}
</script>
```