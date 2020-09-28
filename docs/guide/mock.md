# 模拟数据

开发版模式下使用 `$admin.fetch` 发送请求，支持模拟数据，模拟数据的设置也超级简单，只需在根目录创建一个 [mock.js](https://github.com/malacca/vstep/blob/master/mock.js)，也可以在页面组件中通过 `<script mock>` 标签创建模拟数据（该数据并非私有，一旦加载过，其他页面也可使用）。


模拟数据格式

```js
export default {
    '#': Function(Utils): Promise,
    '#foo': Object,
    '#bar': Object,
    'foo': Function | Object,
    'bar': [Function | Object, Number],
}
```

# 基本使用

### `path`

请求的 URI path， 如 

- `$admin.fetch('foo')` （非绝对url, 实际请求会自动添加 apiUrl 前缀）
- `$admin.fetch('/foo')` （绝对url, 实际请求会直接使用该地址）

对应的，在开发版中，可设置对应的 mock 数据

```js
export default {
    'foo': Function,
    '/foo': Function,

    // 可限制请求方式
    'GET foo': Function,
    'POST /foo': Function,
}
```

### `Response` 

一、最简单的，可直接设置数据

```js
export default {
    'foo': {
        code:0,
        data:{}
    },
}
```

二、也可以设置为函数，这样更为灵活且可模拟 HTTP status/header

```js
export default {
    '/foo': (res, req, utils) => {
        return res
            .status(500)
            .header('foo', 'foo')
            .send({
                code:0
            })
    },
}
```

三、支持设置延迟时间（单位：毫秒）

```js
export default {
    'foo': [
        {},
        1500
    ]
    '/foo': [
        (res, req, utils) => {},
        1500
    ]
}
```

# 函数参数

如上例所示，mock 返回数据可设置为函数来灵活处理，函数原型为

`Function(Response, Request, Utils): Promise`


一、 Response: 其对象原型为以下结构，可模拟 http response status/header/payload

```js
class mockRes {
    status(code, text) {
    }
    header(key, value) {
    }
    send(payload) {
    }
}
```

二、Request: 为 JS [Request](https://developer.mozilla.org/zh-CN/docs/Web/API/Request/Request) 对象

三、Utils： 为 mock 功能提供的工具函数，目前结构如下，以后根据实际需要，可能会添加一些其他工具函数

```js
Utils = {
    db: Dexie
}
```

`db:Dexie` 详细文档参考 [Dexie](https://dexie.org/)（一个在浏览器 IndexedDB 驱动器），方便在 mock 中模拟服务端存储过程。

使用方式简述（相关参考：[Dexie.Version.stores](https://dexie.org/docs/Version/Version.stores())）

```js
export default {
    /*
    1. 这是一个特殊定义， key 为 '#'，在 mock 载入前会自动调用，用于执行一些前置操作
    2. db 是一个已经创建且实例化的 Dexie 对象，且额外添加了一个 scheme 方法来替代 Dexie.Version.stores
    3. 可以在载入时，创建 Dexie 数据表，可放心使用，不会重复创建；若在创建后修改数据表结构，会删除原数据表重新创建
    */
    '#': ({db}) => {
        return db.scheme({
            account: "++id,phone,pwd,name",
        })
    },

    // 创建了数据表，就可以使用 mock 来模拟 curd 的服务端响应了
    'POST create': (res, req, ({db})) => {
        return req.json().then(json => {
            return db.table('account').put(json)
        }).then(() => {
            return res.send({})
        })
    },
    'POST update': (res, req, ({db})) => {
        return req.json().then(json => {
            return db.table('account').update(json.id, json)
        }).then(() => {
            return res.send({})
        })
    },
    'read': (res, req, ({db})) => {
        return db.table('account').toArray().then(list => {
            return res.send(lists)
        })
    },
    'POST delete': (res, req, ({db})) => {
        return req.json().then(json => {
            return db.table('account').where('id').equals(json.id).delete();
        }).then(rs => {
            return res.send(rs ? {
                code:0,
                message:'删除成功'
            } : {
                code:500,
                message:'删除失败'
            })
        })
    },
}
```

# 静态提取

这是一个不怎么推荐使用的功能，实现该功能一定程度上是为了 `Vepanel` 演示站，在 mock 定义时 `path` 以 `#` 开头

```js
export default {
    '#foo': {code:0,data:"foo"},
    '#bar': {code:0,data:"bar"},
}
```

可以执行 `npm run mock` 提取这些静态数据并生成为文件，这样在 [生产版](demo) 也可以有一个返回模拟数据的服务端。
但考虑到生产版肯定有实际服务端了，所以该功能用途并不大，只是在实现无服务端的演示网站时比较有用。

因为不具有普遍性，所以编译方式非常粗暴，直接提取静态数据，导致该功能有一个限制，mock 代码块中不支持 import 引入其他组件，否则会提取失败。