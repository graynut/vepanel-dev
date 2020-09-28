# CURD-FORM 组件

使用 配置 生成 form 表单, 可读性/维护性 明显变差，但配合自动表单生成，配置式创建表单则有优势，首先代码量少，其次，配置式表单的配置信息由于是 json 格式，更适合二次开发、甚至直接存储到数据库。

```html
<template>
<curd-form v-bind="myForm" ref="curdForm" @submit="onSubmit">

    <el-col slot="header">
        自定义表单顶部
    </el-col>

    <template #footer="scope">
        <el-col><el-form-item>
            <el-button type="primary" :loading="scope.submiting" @click="scope.submitForm">立即提交</el-button>
            <el-button @click="scope.resetFields">重置</el-button>
        </el-form-item></el-col>
    </template>

    <template #any="scope">
        其他任意自定义 slot 模板
    </template>

</curd-form>
</template>

<script>
import {curdForm} from 'curd';

export default {
    components:{
        curdForm
    },
    data(){
        return {
            myForm:{}
        }
    },
    methods:{
        onSubmit(data){
            console.log(data);
            //调用 done 函数, 清除 提交按钮的 loading 状态
            setTimeout(done, 1200);
        }
    }
}
</script>
```


# slot 模板

### `header`

在表单顶部插入自定义元素，默认为空

### `footer`

 - 自定义表单底部，默认情况下显示提交按钮
 - 若设置 `props.no-footer` 为 `true`，则不显示
 - 若自定义底部模板，则设置无效，总会显示自定义的模板

slot 内支持使用变量
- submiting: bool - 是否正在提交中
- submitForm: function  - 提交表单
- resetFields: function  - 重置表单

当然，处理提交操作，也可以不使用这些 slot 变量，而是通过调用 `$refs.curdForm` 的 API 来自行实现这些操作

### `any`

其他任意自定义 slot 模板，这些模板可用于支持 slot 的表单字段


# 回调

### `@submit`

提交表单的回调函数，由 `submitForm` 提交函数触发。

```js
methods:{
    onSubmit(data, done){
        console.log(data)
        setTimeout(done, 1200)  //调用 done 函数, 清除 提交按钮的 loading 状态
    }
},
```

# API

使用指定的 ref （`this.$refs.curdForm`） 调用 API

支持 `el-form` 的 API，参见：https://element.eleme.cn/#/zh-CN/component/form#form-methods

额外新增 `submitLoad` / `submitDone` / `submitForm` 三个方法，调用 `submitForm` 会触发 `@submit` 事件

1. 默认的 footer 提交按钮点击调用 submitForm

2. 自定义可直接使用 scope.submiting 和 scope.submitForm 来实现与默认 footer 按钮一致的效果，也会触发 @submit 回调

3. 也可以自行处理提交事件，但这样就不再触发 @submit 回调了



# 支持属性

即上面示例中 `MyForm` 支持的配置字段

### `el-form` 部分属性

参见：https://element.eleme.cn/#/zh-CN/component/form#form-attributes

支持：`size`，`label-position`，`label-width`， `hide-required-asterisk`，`inline-message`，`validate-on-rule-change`，`disabled`

### `m-label-position`

作用同 `label-position`，在 width<768 时生效

### `forceSpan` String

`any | xs | sm`

- any: `label-position`/`m-label-position` 以及下面提到的 fields 字段中的 `span`/`xspan` 会自动根据屏幕宽度匹配
- xs: 强制显示为 phone 版
- sm: 强制显示为 pc 版

当然，也可以设置 `label-position`/`m-label-position` 相同，`span`/`xspan`相同，从而在 pc/phone 上显示相同

### `gutter`

表单内部元素使用 `el-row` 部分，该属性设置栅格间隔

### `submit-text`

提交按钮文字，默认：立即提交

### `reset-text`

重置按钮文字，默认：重置

### `no-footer`

不在表单底部显示提交按钮

### `fields`

表单字段配置

### `data`

表单字段初始值


### `fields`

表单字段配置，这是一个 Array 类型

```js
表单字段(fields) 单项配置
[{
    // col 布局配置
    span: 24,         // 栅格数
    xspan: 24,        // 手机界面下栅格数
    label:'标题',    // 标签文本
    labelWidth: ''   // 标签宽度
    labelDisable:false, // 不显示标签
    help: "",         // 提示信息
    vshow:['otherField', '>=', 'someValue'],  // 由其他字段决定当前字段是否显示

    // 组件通用配置
    component:"",     // 组件名 (也可以是一个组件Object)
    template:"",      // slot名称; 不使用组件, 而是使用一个 slot 模板(与组件互斥,二选一,组件优先)
    name:'title',     // 字段名
    required:false,   // 是否必填
    reqmsg:null,      // 若必填, 未填的错误提示, 可缺省
    styleWidth:'',    // 设置组件宽度, 若存在 props.style.width 则忽略这个

    // 组件具体配置
    props:{},         // 组件 v-bind props  
    rules:[],         // 验证规则
    events:{},        // 组件 v-on events 
    slots:{},         // 组件 slots 模板
}]
```

所以最终配置格式大概如下

```js
....

data(){
    return {
        myForm:{
            size,
            labelPosition,
            mLabelPosition,
            gutter,
            ...
            fields:[
                {
                    name,
                    component,
                    ...
                },
                .....
            ],
            data:{
                name:value,
                .....
            }
        }
    }
}

...
```

