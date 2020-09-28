# 登陆验证

还记得在 [快速开始](start.md) 章节 `loader.js` 中配置的 `login` / `logout` / `passport` / `menus` 么？


为简单起见，所设置的服务端接口返回的数据结构是固化的，按照以下格式返回

## 一、login

用户登录

```
> POST /login HTTP/1.1
> {"user":"string","pwd":"string"}
```

登陆成功，服务端返回 HTTP 200 并设置登录凭证

```
HTTP/1.1 200 OK
Set-Cookie: blabla
```

登陆失败，服务端可返回提示信息

```
HTTP/1.1 200 OK
{"code"500,"message":"你输入的账号或密码不正确"}
```


## 二、passport

请求当前用户信息

```
> GET /auth HTTP/1.1
Cookie: blabla
```

若用户已登录，返回用户信息及权限

```
HTTP/1.1 200 OK
{"name":"string","permissions":[], ...其他任意字段,根据需要,如用户头像电话等信息...}
```

权限字段 `permissions` 数据结构比较简单，只需返回权限列表即可，用于 js 端判断依据，参见 [全局 API](api.md)

```
"permissions":["foo","bar","biz"]
```

若用户未登录，返回 HTTP 401

```
HTTP/1.1 401 Unauthorized
```

## 三、logout

退出登录

```
> POST /logout HTTP/1.1
```

服务端返回 HTTP 200, 并清除登录凭证

```
HTTP/1.1 200 OK
Set-Cookie: blabla
```

## 四、menus

请求当前用户的菜单列表数据

```
> GET /menus HTTP/1.1
```

Http Response

```
HTTP/1.1 200 OK
[{},{}...]
```

菜单列表的数据结构为

```json
//应自行根据当前用户角色返回 其拥有权限的菜单列表
//菜单可无限级嵌套子菜单, 但建议不超过三级嵌套
[
    {
        // name:主分类名称 | icon: 图标 (名称图标显示在左侧) / title:主分类标题(显示在左侧顶部)
        name:'',
        icon:'',
        title:'',

        // 主分类一级菜单
        menus:[
            // 分割小标题
            {
                name:'内容管理',
                [icon: ''],
            },

            // 链接: link 为 http:// 开头链接自动认为是外链, 普通路径则认为是 vue 路由
            // 也可以通过 external:true 强制指定在新窗口打开
            {
                name: '新增内容',
                link: '/account',
                [icon: ''],
                [external:false],
            },

            // 折叠组
            {
                name:'',
                [icon:''],
                [open:false],
                menus:[
                    {...分割...},
                    {...链接...},
                    {...折叠组...}
                ]
            }
        ]
    },
    ...可以有多个主分类...
]
```


## 五、跨域问题

1. 在 [快速开始](start.md) 章节 `loader.js` 中有一个 `cookieMode` 配置，默认为 `cors`，即每次请求后端都会携带 `cookie`；
2. 登陆成功后，`passport` 接口除返回用户信息外，还应返回一个 `Set-Cookie` 的 `header` 保存 `cookie` 用于后续的登陆验证。
3. 由于浏览器的限制，若后台域名与 API 域名不同，默认情况下 `cookie` 是否无法正常发送/保存的，所有需要 `cookie` 的 API 接口
   都要携带 Header: `Access-Control-Allow-Origin: http://foo.example` 

以上是默认的跨域解决方案，也可参考 [Request](https://developer.mozilla.org/zh-CN/docs/Web/API/Request/mode)、[CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS) 等相关文档自行设计。