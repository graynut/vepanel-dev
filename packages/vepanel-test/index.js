define(["exports","vepanel","module"],function(a,e,t){"use strict";var s=t.uri.split("?")[0].split("/"),n=s.pop(),i=s=s.join("/")+(n.endsWith(".js")?"":"/"+n)+"/";function o(){alert("foo")}function c(){alert("bar")}function d(){alert("utils")}var r=i+"assets/vue.82b9c7a5.png",l=i+"assets/vepanel.4c9462c1.png",f=i+"assets/logo.b1e1a630.png",v=i+"assets/vue.82b9c7a5.png",u=i+"assets/vepanel.4c9462c1.png",b=i+"assets/logo.b1e1a630.png",p=i+"assets/vue.82b9c7a5.png",g=i+"assets/vepanel.4c9462c1.png",m=i+"assets/logo.b1e1a630.png",_={data:function(){return{foo:v,bar:u,biz:b}},methods:{func_foo:o,func_bar:c,func_utils:d}},x=function(a){a&&a("data-v-ff716dbe_0",{source:".vepanel-flex[data-v-ff716dbe]{width:270px;display:flex;flex-wrap:wrap}.vepanel-flex div[data-v-ff716dbe],.vepanel-flex img[data-v-ff716dbe]{width:30px;height:30px;background-size:cover}.vepanel-flex button[data-v-ff716dbe]{width:90px}.foo2[data-v-ff716dbe]{background:url("+i+"assets/vue.82b9c7a5.png)}.bar2[data-v-ff716dbe]{background:url("+i+"assets/vepanel.4c9462c1.png)}.biz2[data-v-ff716dbe]{background:url("+i+"assets/logo.b1e1a630.png)}",map:void 0,media:void 0})},h=e.n,k=e.c,w=i+"assets/vue.82b9c7a5.png",z=i+"assets/vepanel.4c9462c1.png",C=i+"assets/logo.b1e1a630.png",y={components:{subTest:h({render:function(){var a=this,e=a.$createElement,t=a._self._c||e;return t("div",{staticClass:"vepanel-flex"},[t("img",{attrs:{src:p}}),t("img",{attrs:{src:g}}),t("img",{attrs:{src:m}}),t("img",{attrs:{src:a.foo}}),t("img",{attrs:{src:a.bar}}),t("img",{attrs:{src:a.biz}}),t("div",{staticClass:"foo2"}),t("div",{staticClass:"bar2"}),t("div",{staticClass:"biz2"}),t("button",{on:{click:a.func_foo}},[a._v("Foo")]),t("button",{on:{click:a.func_bar}},[a._v("Bar")]),t("button",{on:{click:a.func_utils}},[a._v("Utils")])])},staticRenderFns:[]},x,_,"data-v-ff716dbe",!1,void 0,!1,k,void 0,void 0),subAsync:function(){return requireComponent(i+"./sub/index.js")}},data:function(){return{foo:r,bar:l,biz:f}},methods:{func_foo:o,func_bar:c,func_utils:d}},j=function(a){a&&a("data-v-d9af387e_0",{source:".vepanel-test[data-v-d9af387e]{display:inline-block}.vepanel-flex[data-v-d9af387e]{width:270px;display:flex;flex-wrap:wrap}.vepanel-flex div[data-v-d9af387e],.vepanel-flex img[data-v-d9af387e]{width:30px;height:30px;background-size:cover}.vepanel-flex button[data-v-d9af387e]{width:90px}.foo[data-v-d9af387e]{background:url("+i+"assets/vue.82b9c7a5.png)}.bar[data-v-d9af387e]{background:url("+i+"assets/vepanel.4c9462c1.png)}.biz[data-v-d9af387e]{background:url("+i+"assets/logo.b1e1a630.png)}",map:void 0,media:void 0})},F=(0,e.n)({render:function(){var a=this,e=a.$createElement,t=a._self._c||e;return t("div",{staticClass:"vepanel-test"},[t("div",{staticClass:"vepanel-flex"},[t("img",{attrs:{src:w}}),t("img",{attrs:{src:z}}),t("img",{attrs:{src:C}}),t("img",{attrs:{src:a.foo}}),t("img",{attrs:{src:a.bar}}),t("img",{attrs:{src:a.biz}}),t("div",{staticClass:"foo"}),t("div",{staticClass:"bar"}),t("div",{staticClass:"biz"}),t("button",{on:{click:a.func_foo}},[a._v("Foo")]),t("button",{on:{click:a.func_bar}},[a._v("Bar")]),t("button",{on:{click:a.func_utils}},[a._v("Utils")])]),t("sub-test"),t("sub-async")],1)},staticRenderFns:[]},j,y,"data-v-d9af387e",!1,void 0,!1,e.c,void 0,void 0),T={install:function(){Vue.component("vepanelTest",F)}};a.default=T,a.vepanelTest=F,Object.defineProperty(a,"__esModule",{value:!0})});