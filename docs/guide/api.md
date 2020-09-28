# 全局 API

`VePanel` 共提供三类全局 API 以供使用

1. 在 windows 对象上的 API，任何地方都可使用
2. 以 `Vue.prototype` 定义的 API，在所有 vue 组件内可使用
3. 中台根组件暴露的 API，在所有 vue 组件内可使用


## 一、requireComponent

定义在 windows 对象下的 API，用于创建 vue 异步组件，可参阅 [页面组件](sfc.md)

方法：`requireComponent(String:path, Bool:spinner)`

```js
// 用于异步加载 本地 或 远程 组件
const components = {

    // 加载 相对于当前组件 的路径
    foo: () => requireComponent('./foo'),

    // 加载 线上资源库中的 组件
    bar: () => requireComponent('bar');

    // 加载 指定 url 的组件
    baz: () => requireComponent('http://url.com/baz.js');

    // 在加载组件时, 显示一个 加载图标, 通常, 在异步组件作为整个页面时, 这样使用
    // 比如 [页面组件] 章节的示例, 用这个就比较合适
    path: () => requireComponent(path, true);

};

// spinner:true 会让组件表现的与 路由组件一样, 显示加载图标, 失败时显示错误页面
// 若不是作为页面组件, 只是一个子组件, 默认处理可能不合适, 可自行设计
// 参考 vue异步组件: https://cn.vuejs.org/v2/guide/components-dynamic-async.html
const components = {
  path: () => ({
    component: requireComponent(path),
    // 异步组件加载时使用的组件
    loading: LoadingComponent,
    // 加载失败时使用的组件
    error: ErrorComponent,
    // 展示加载时组件的延时时间。默认值是 200 (毫秒)
    delay: 200,
    // 如果提供了超时时间且组件加载也超时了，
    // 则使用加载失败时使用的组件。默认值是：`Infinity`
    timeout: 3000
  })
}
```


## 二、Vue.prototype.$admin

可以在所有组件内使用 `this.$admin` 调用，如

```js
export default {
  methods: {
    action(){
      this.$admin.alert('message')
    }
  }
}
```

### `$admin.config`

Object: 获取启动配置，具体结构可参阅 [快速开始](start.md)

### `$admin.reload()`

Void: 刷新当前页面，因为使用了 [keep-alive](https://cn.vuejs.org/v2/api/#keep-alive) 包裹 router 页面，
reload 并不会销毁组件重建，所以需要页面组件在 [activated](https://cn.vuejs.org/v2/api/#activated) 生命周期予以响应。

### `$admin.loadType()`

可以在 `activated` 或其他任何需要的地方获取当前页面加载方式

Int: [0:通过链接打开的； 1:由前进按钮激活；-1:后退按钮激活; 2:调用刷新函数激活]

### `$admin.error(Int:code, String:text)`

Void: 显示错误页面

### `$admin.alert(String:text)`

Promise: 弹出提示框

### `$admin.confirm(String:text)`

Promise: 弹出确认框

### `$admin.setStore(String:key, Any:value)`

Void: 缓存一个全局变量，可在任何组件调用

### `$admin.getStore(String:key)`

Any: 获取一个全局变量，可在任何组件调用

### `$admin.startProgress()`

Void: 显示顶部加载条

### `$admin.endProgress()`

Void: 顶部加载条满载并隐藏

### `$admin.fetch(String|Request:input, Object:init, Bool:resJson)`
### `$admin.fetchJson(String|Request:input, Object:init)`
### `$admin.postJson(String|Request:input, String|Object:body)`

三个函数都返回 Promise 对象

1. `$admin.fetch` 与 window.fetch 相同，得到 `Response` 对象
2. `$admin.fetchJson` 相比 `fetch`，内部多了一步 `response.json()`，所以直接得到 json 数据
3. `$admin.postJson` 与 `fetchJson` 同，得到 json 数据，但第二个参数改为了 body，且以 POST method 发送

相比 [window.fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)，`$admin.fetch` 新增以下特性
 
- 开发版模式下，可使用 mock 数据
- 请求时会自动显示 Progerss bar
- input 为非 http:// 开头的相对 url String 时, 会自动添加上启动配置设置的 `apiUrl` 前缀。
- fetch 默认参数 mode 改为启动配置中 `cookieMode` 设置的值, 默认参数 credentials='include'
- response 默认经过 fetchGuard 预处理 (可使用 init.guard = false 关闭预处理)
- 默认会自动处理请求异常，可使用 init.handleError, init.alertError 配置
- 请求抛出的异常会被格式化, 含有 code/message 字段, 可能包含 request/response/error 信息

```js
// 实际请求接口 为 apiUri/foo
$admin.fetch("foo", {})

// 直接使用绝对 url, 请求地址为：/foo
$admin.fetch("/foo", {})

// 若 input 为 Request, 由于 input 内已经把 url 转为绝对地址了，所以请求接口为 /foo
$admin.fetch(new Request('foo'), {})

// 对于 input 为 Request, 仍需要自动加 apiUrl, 可以通过 init
$admin.fetch(new Request('foo'), {
  url: 'foo'
})

// init 缺省设置与 window.fetch 不同，但都可被重置
$admin.fetch('foo', {
  mode: 'cors',           // 标准参数: 默认改为 启动配置中 cookieMode 的设置值
  credentials:'include',  // 标准参数: 默认改为了 include
  ....                    // 其他任意 window.fetch 支持的标准参数

  guard:true,             // 非标参数: 是否进行预处理
  handleError:true,       // 非标参数: 是否自动处理异常
  alertError:null,        // 非标参数: 处理异常的方式,  
                          //    null:  自动， GET请求出现异常，会显示错误页；POST请求异常会以 alert 方式显示
                          //    true:  强制使用 alert 方式显示异常
                          //    false: 强制使用 错误页 方式显示异常
}).then(res => {

  // res 为 Response 对象

}).catch(error => {
  // 异常会被格式化
  // error = {
  //   code: Int,            // 错误代码
  //   message: String,      // 错误信息

  //   [request: Request],   // 请求 Request
  //   [response: Response]  // 请求 Response
  //   [error: Error]        // 原始 Error
  // }
})


// 以下 res 会返回 Json 格式, guard 参数才有意义
$admin.fetch('foo', {}, true).then(res => {})
$admin.fetchJson('foo', {}).then(res => {})
$admin.postJson('foo', "body").then(res => {})


/* 关于 guard

若服务端 Reponse 的 Http Code 不是 20X，会自动抛出异常
fetch 后一般会先对 Response 数据的正确性进行校验，这种校验可能会出现在所有接口中
所以，VePanel 内置了一个预处理的方，可以通过 guard:false 关闭
预处理很简单，只对  {code, message, ...} 形式的 json 进行处理
*/

// 1. code=0 且 有 data 字段，仅返回 data 数据  {foo:"foo"}
payload: {code:0, data:{foo:"foo"}}

// 2. code=0 但 没有 data 字段，返回原始 payload 数据 {code:0, foo:"foo"}
payload: {code:0, foo:"foo"}

// 3. code!=0 ，抛出异常
payload: {code:1001, message:"发送错误"}

// 4. 不是 Object 类型，或者没有 code 字段，原样返回
payload: {foo:"foo"}
payload: ["foo", "bar"]

```

## 三、Vue.prototype.$perms

权限判断函数，根据 `passport` 接口返回的权限列表自动判断当前用户是否有权执行某个操作，可用于 模板 或 js逻辑中

    Bool: $perms((String | Array):permissions, Bool:or)
    Bool: $perms(String)       //校验单个权限
    Bool: $perms(Array)        //校验多个权限，必须全部通过
    Bool: $perms(Array, true)  //校验多个权限，通过一个即可

```html
<template>
  <div class="app-main">
    <button v-if="$perms('add')" @click="add">添加数据</button>
  </div>
</template>

<script>
export default {
  methods: {
    add(){
      if (!this.$perms(['add', 'edit'])) {
        return;
      }
    }
  }
}
</script>
```

> 备注：有不少中后台框架会将权限判断以指令方式注入，如使用 `v-permission=""` 来进行判断，这样操作从语义上看起来确实舒服，也能少写几个字符。
> 但 `vue` 并没有提供类似 `v-if` 的插件机制，指令方式往往是在组件实例化后从 DOM 中移除，根据 `vue` 的机制，是从子组件往上实例化的，这就是说：
> 如果 `v-permission` 绑定在较为顶层的组件上，会浪费一大圈精力实例化组件，然后再移除；而 `v-if` 则不存在这个问题，所以最终决定仅提供 API，而不提供指令。


## 四、$root

`$root` 在所有组件内都能调用

```js
export default {
  methods: {
    action(){
      this.$root.logout()
    }
  }
}
```

### `$root.passport`

Object: 当前登陆用户的账户信息

### `$root.menus`

Object: 当前用户的菜单列表数据

### `$root.reloadMenu()`

Promise: 重新请求服务端，更新 menus

### `$root.reloadPassport()`

Promise: 重新请求服务端，更新 passport


> 以上 API 是 `VePanel` 注入到 $root 组件的，没有放在 $admin 中提供是因为：在 $root 组件中，变量能自动监听。
> 这意味着你可以在任意组件模板中使用如 `passport.name`，且会随着变量的变化自动更新。以下 API 是 $root 的 methods，也可以在任意组件调用


### `$root.isExpand()`

Bool: 菜单栏是否处于展开状态

### `$root.expand()`

Promise: 展开菜单，返回菜单是否展开

### `$root.collapse()`

Promise: 关闭菜单，返回菜单是否展开

### `$root.toggleAside()`

Promise: 切换菜单的 展开关闭状态，返回菜单是否展开

### `$root.switchMenu(Int:index)`

Void: 当有多组顶级菜单时，切换到指定组

### `$root.logout()`

void: 退出登录