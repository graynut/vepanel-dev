define(["vepanel","module","curd-utils"],function(e,t,a){"use strict";a=a&&Object.prototype.hasOwnProperty.call(a,"default")?a.default:a;var i=t.uri.split("?")[0].split("/"),n=i.pop(),s=(i=i.join("/")+(n.endsWith(".js")?"":"/"+n)+"/",{data:function(){return{add:"",icons:[],activeName:""}},created:function(){this.reload()},methods:{reload:function(e){var t=[],i=1,n={label:"Element",name:"Element",icons:[]};a.getAllIcons().forEach(function(e){if("/"===e)return t.push(n),n={label:"# "+i,name:"n"+i,icons:[]},void i++;n.icons.push(e)}),t.push(n),this.icons=t,this.activeName=e?n.name:"Element"},addCss:function(){var e=this;this.add&&(/^(|https?:)\/\/at.alicdn.com/.test(this.add)&&this.add.endsWith(".css")?require(["css!"+this.add.substr(0,this.add.length-4)],function(t){t?(e.add="",e.reload(!0),e.$message("加载成功")):e.$admin.alert("加载失败")}):this.$admin.alert("错误的地址"))}}}),c=function(e){e&&e("data-v-0eb23f24_0",{source:".icon-card{box-shadow:none;margin-top:20px}.icon-card .el-tab-pane{display:flex;flex-wrap:wrap}.icon-card-item{width:90px;text-align:center;margin:10px}.icon-card-item i{font-size:36px}.icon-card-item p{font-size:10px;color:#adadad}",map:void 0,media:void 0})};return(0,e.n)({render:function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"app-main"},[a("div",{staticStyle:{display:"flex","align-items":"center"}},[a("el-input",{staticStyle:{flex:"1"},attrs:{placeholder:"添加一个 css 地址, 仅支持 iconfont cdn 地址"},model:{value:e.add,callback:function(t){e.add=t},expression:"add"}},[a("el-button",{attrs:{slot:"append",icon:"el-icon-circle-plus"},on:{click:e.addCss},slot:"append"})],1)],1),a("el-tabs",{staticClass:"icon-card",attrs:{type:"border-card"},model:{value:e.activeName,callback:function(t){e.activeName=t},expression:"activeName"}},e._l(e.icons,function(t){return a("el-tab-pane",{key:t.name,attrs:{name:t.name,label:t.label}},e._l(t.icons,function(t){return a("div",{key:t,staticClass:"icon-card-item"},[a("i",{class:t}),a("p",[e._v(e._s(t))])])}),0)}),1)],1)},staticRenderFns:[]},c,s,void 0,!1,void 0,!1,e.c,void 0,void 0)});