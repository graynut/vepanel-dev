define(["vepanel","module"],function(t,e){"use strict";var i=e.uri.split("?")[0].split("/"),n=i.pop(),s=(i=i.join("/")+(n.endsWith(".js")?"":"/"+n)+"/",{methods:{test:function(){alert("oj8k")}}}),o=function(t){t&&t("data-v-27f15532_0",{source:".middel[data-v-27f15532]{height:60px;background:#ccc}",map:void 0,media:void 0})};var a={components:{middle:(0,t.n)({render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"middel"},[e("button",{on:{click:this.test}},[this._v("本地中间组件")])])},staticRenderFns:[]},o,s,"data-v-27f15532",!1,void 0,!1,t.c,void 0,void 0)},methods:{foo:function(){alert("foo")},bar:function(){alert("bar")},utils:function(){alert("utils")}}};return(0,t.n)({render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"app-main"},[e("el-card",{attrs:{shadow:"never",header:"本地组件"}},[e("middle")],1),e("el-card",{staticStyle:{"margin-top":"20px"},attrs:{shadow:"never",header:"本地函数"}},[e("el-button",{attrs:{type:"success"},on:{click:this.foo}},[this._v("Foo")]),e("el-button",{attrs:{type:"warning"},on:{click:this.bar}},[this._v("Bar")]),e("el-button",{attrs:{type:"danger"},on:{click:this.utils}},[this._v("Utils")])],1)],1)},staticRenderFns:[]},void 0,a,void 0,!1,void 0,!1,void 0,void 0,void 0)});