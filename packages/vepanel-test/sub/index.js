define(["vepanel","module"],function(a,t){"use strict";var e=t.uri.split("?")[0].split("/"),s=e.pop(),n=e=e.join("/")+(s.endsWith(".js")?"":"/"+s)+"/";var i=n+"../assets/vue.82b9c7a5.png",o=n+"../assets/vepanel.4c9462c1.png",c=n+"../assets/logo.b1e1a630.png",r=n+"../assets/vue.82b9c7a5.png",f=n+"../assets/vepanel.4c9462c1.png",d=n+"../assets/logo.b1e1a630.png",l={data:function(){return{foo:i,bar:o,biz:c}},methods:{func_foo:function(){alert("foo")},func_bar:function(){alert("bar")},func_utils:function(){alert("utils")}}},v=function(a){a&&a("data-v-ff716dbe_0",{source:".vepanel-flex[data-v-ff716dbe]{width:270px;display:flex;flex-wrap:wrap}.vepanel-flex div[data-v-ff716dbe],.vepanel-flex img[data-v-ff716dbe]{width:30px;height:30px;background-size:cover}.vepanel-flex button[data-v-ff716dbe]{width:90px}.foo2[data-v-ff716dbe]{background:url("+n+"../assets/vue.82b9c7a5.png)}.bar2[data-v-ff716dbe]{background:url("+n+"../assets/vepanel.4c9462c1.png)}.biz2[data-v-ff716dbe]{background:url("+n+"../assets/logo.b1e1a630.png)}",map:void 0,media:void 0})};return(0,a.n)({render:function(){var a=this,t=a.$createElement,e=a._self._c||t;return e("div",{staticClass:"vepanel-flex"},[e("img",{attrs:{src:r}}),e("img",{attrs:{src:f}}),e("img",{attrs:{src:d}}),e("img",{attrs:{src:a.foo}}),e("img",{attrs:{src:a.bar}}),e("img",{attrs:{src:a.biz}}),e("div",{staticClass:"foo2"}),e("div",{staticClass:"bar2"}),e("div",{staticClass:"biz2"}),e("button",{on:{click:a.func_foo}},[a._v("Foo")]),e("button",{on:{click:a.func_bar}},[a._v("Bar")]),e("button",{on:{click:a.func_utils}},[a._v("Utils")])])},staticRenderFns:[]},v,l,"data-v-ff716dbe",!1,void 0,!1,a.c,void 0,void 0)});