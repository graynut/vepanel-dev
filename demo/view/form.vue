<template>
    <div class="app-form">
        <curd-form v-bind="form" :data="data" ref="curdForm" @submit="onSubmit">

            <!--slot:header-->
            <el-col slot="header" style="margin-bottom:25px">
                <el-card shadow="hover">
                    该表单由 <router-link to="/maker">表单制作器</router-link> 生成后修改
                </el-card>
            </el-col>

            <!--slot:用于表单组件 props-->
            <template #inputAppend>
                <el-button icon="el-icon-brush"></el-button>
            </template>

            <template #inputPrepend="scope">
                <el-button :icon="scope.icon"></el-button>
            </template>

            <!--slot:模版形式组件-->
            <template #split="scope">
                <div v-bind="scope.props" v-on="scope.events" :style="scope.styles">以下非必填</div>
            </template>
        </curd-form>
    </div>
</template>

<script>
import curd from 'curd';
export default {
    components:{
        curdForm: curd.curdForm
    },
    data(){
        const self = this;
        return {
            form:{
                "size": "medium",
                "labelPosition": "right",
                "mLabelPosition": "top",
                "labelWidth": 100,
                "gutter": 0,
                "hideRequiredAsterisk": false,
                "inlineMessage": false,
                "disabled": false,
                "fields": [
                    // 举例说明 props rules events slots
                    {
                        name:"name",
                        label:"活动名称",
                        help:"该组件为演示组件, 举例说明了组件配置的使用方法",
                        component:"el-input",
                        props:{
                            prefixIcon:"el-icon-box"
                        },
                        rules:[
                            {pattern: "^[\\u0391-\\uFFE5]+$", message:"只能使用中文", trigger: 'blur'}
                        ],
                        events:{
                            focus(){
                                console.log('foucs')
                            }
                        },
                        slots:{
                            // 直接使用名称
                            append:"inputAppend",
                            // 支持额外传递参数
                            prepend:{
                                name:"inputPrepend",
                                props:{
                                    icon:"el-icon-edit-outline"
                                }
                            }
                        }
                    },
                    {
                        "name": "region",
                        "styleWidth": "100%",
                        "label": "活动区域",
                        "component": "el-select",
                        "props": {
                            "options": [
                                {
                                    "label": null,
                                    "options": [
                                        {
                                            "label": "上海",
                                            "value": 1
                                        },
                                        {
                                            "label": "北京",
                                            "value": 2
                                        }
                                    ]
                                },
                                {
                                    "label": "华南",
                                    "options": [
                                        {
                                            "label": "广州",
                                            "value": 3
                                        },
                                        {
                                            "label": "深圳",
                                            "value": 4
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        "name": "date1",
                        "span": 12,
                        "xspan": 24,
                        "styleWidth": "100%",
                        "label": "活动时间",
                        "component": "el-date-picker",
                        "props": {}
                    },
                    {
                        "name": "date2",
                        "span": 12,
                        "xspan": 24,
                        "labelWidth": "36px",
                        "styleWidth": "100%",
                        "label": "-",
                        "component": "el-time-picker",
                        "props": {}
                    },
                    {
                        "name": "delivery",
                        "label": "即时配送",
                        "component": "el-switch",
                        "props": {}
                    },
                    {
                        "name": "level",
                        "label": "活动等级",
                        "component": "el-rate",
                        "props": {
                            "voidIconClass": "el-icon-bell",
                            "iconClasses": [
                                "el-icon-message-solid",
                                "el-icon-message-solid",
                                "el-icon-message-solid"
                            ],
                            "colors": [
                                "#F7BA2A",
                                "#F7BA2A",
                                "#F7BA2A"
                            ],
                            "showText": true,
                            "texts": [
                                "一般",
                                "优先",
                                "加快",
                                "紧急",
                                "立即"
                            ]
                        }
                    },
                    {
                        "name": "type",
                        "label": "活动性质",
                        "component": "el-checkbox-group",
                        "props": {
                            "options": [
                                {
                                    "label": "美食/线上餐厅活动",
                                    "value": 1
                                },
                                {
                                    "label": "地推活动",
                                    "value": 2
                                },
                                {
                                    "label": "线下主题活动",
                                    "value": 3
                                },
                                {
                                    "label": "品牌曝光营销",
                                    "value": 4
                                }
                            ]
                        }
                    },
                    {
                        "name": "resource",
                        "label": "特殊资源",
                        "component": "el-radio-group",
                        "props": {
                            "options": [
                                {
                                    "label": "线上品牌赞助商",
                                    "value": 1
                                },
                                {
                                    "label": "线下场地免费",
                                    "value": 2
                                }
                            ]
                        }
                    },
                    // 举例, 使用 template, 仍可使用 布局配置、通用配置
                    {
                        label:"表单说明",
                        help:"template 特殊组件",
                        template:"split",
                        props:{
                            style:{color:'#999', display:"inline-block"}
                        },
                        events:{
                            click(){
                                self.$admin.alert('被你发现了')
                            }
                        }
                    },
                    {
                        "name": "desc",
                        "label": "活动简述",
                        "component": "el-input",
                        "props": {
                            "type": "textarea",
                            "rows": 4
                        }
                    },
                    {
                        "name": "detail",
                        "label": "活动详情",
                        "component": "curd-editor",
                        "props": {
                            "options": {
                                "items": [
                                    "bold",
                                    "italic",
                                    "underline",
                                    "strikethrough",
                                    "formatblock",
                                    "fontname",
                                    "fontsize",
                                    "lineheight",
                                    "forecolor",
                                    "hilitecolor",
                                    "|",
                                    "justify",
                                    "insertunorderedlist",
                                    "insertorderedlist",
                                    "indent",
                                    "outdent",
                                    "link",
                                    "unlink",
                                    "emoticons",
                                    "image",
                                    "table",
                                    "baidumap",
                                    "pagebreak",
                                    "quickformat",
                                    "source",
                                    "fullscreen"
                                ]
                            },
                            "footer": {
                                "crawl": "采集远程图片",
                                "watermark": "图片加水印"
                            }
                        }
                    }
                ]
            },

            data:{
                "name": "",
                "region": "",
                "date1": "",
                "date2": "",
                "delivery": false,
                "level": 0,
                "type": [],
                "resource": "",
                "desc": "",
                "detail": "",
                "crawl": false,
                "watermark": false
            }
        }
    },
    methods:{
        onSubmit(data, done){
            console.log(data);
            setTimeout(done, 1200);
        }
    }
}
</script>