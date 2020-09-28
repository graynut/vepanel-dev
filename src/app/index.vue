<template>
<div :class="'app-container'+ (asideCollapsed ? ' app-container-full' : '')">
    <header class="app-header">
        <div class="app-header-action" @click="toggleAside"><svg viewBox="0 0 20 20" version="1.1" aria-hidden="true"><path d="M2 2h7v7H2zm9 0h7v7h-7zm-9 9h7v7H2zm9 0h7v7h-7z"></path></svg></div>
        <div class="app-header-left">{{name}}</div>
        <div class="app-header-right">
            <router-link to="/passport">{{uname}}</router-link>
            <span @click="logout">退出</span>
        </div>
    </header>

    <aside :class="'app-aside' + (asideOpend ? ' app-aside-opend' : '')">
        <div class="app-aside-mask" @click="collapse"></div>
        <div class="app-aside-navs">
            <div class="app-aside-top" v-if="navs.length > 1"><ul>
                <li v-for="(nav, index) in navs" :key="'k_' + index" @click="switchMenu(index)" :class="index === activeTop ? 'active' : ''">
                    <i :class="nav.icon"/>
                    <p v-if="nav.name">{{nav.name}}</p>
                </li>
            </ul></div>
            <div class="app-aside-sub">
                <div class="app-aside-group" v-for="(nav, index) in navs" :key="'k_' + index" v-show="index === activeTop">
                    <h3 class="name">
                        <i :class="nav.icon||'el-icon-menu'"/>
                        <span>{{nav.title}}</span>
                    </h3>
                    <div class="navs">
                        <el-menu-auto router :groups="nav.groups" :default-openeds="nav.openeds" :default-active="activeMenu" ref="menu" @select="$_onMenuSelect"/>
                    </div>
                </div>
            </div>
        </div>
    </aside>

    <main class="app-wrapper">
        <app-view max="10"/>
    </main>
</div>
</template>


<script>
/* 
应自行根据当前用户角色返回 其拥有权限的菜单列表
菜单可无限级嵌套子菜单, 但建议不超过三级嵌套
menus = [
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
*/
// 解析菜单数据 menus -> navs
let elMenuOpens = [];
const httpRegex = new RegExp('^https?:\/\/', 'i');
function parseMenu(menus){
    const parsed = [];
    this.$_menusLinks = []; //缓存一个 links 数组, 方便判断激活状态
    menus.forEach(items => {
        const menusLinks = {};
        this.$_menusLinks.push(menusLinks);
        if (!('menus' in items) || !Array.isArray(items.menus)) {
            return;
        }
        const groups = parseSubMenu(items.menus, menusLinks);
        if (!groups.length) {
            return;
        }
        parsed.push({
            name: items.name||null,
            icon: items.icon||'el-icon-menu',
            title: items.title||items.name||'控制面板',
            groups
        });
    });
    // 直接在这里创建 el-menu 的菜单, 并提取 default-openeds
    var _vm=this;
    var _h=_vm._self._c||_vm.$createElement;
    var _v=_vm._v;
    parsed.forEach((top, belong) => {
        elMenuOpens = [];
        const groups = [];
        top.groups.forEach((group, index) => {
            groups.push(renderGroup(_h, _v, group, [belong, index], 0))
        });
        top.groups = groups;
        top.openeds = elMenuOpens;
    });
    return parsed;
}
function parseSubMenu(menus, menusLinks) {
    const parsed = [];
    let groupName = null;
    let groupIcon = null;
    let groupItems = [];
    menus.forEach(subMenu => {
        // 有子菜单
        if ('menus' in subMenu) {
            const groups = parseSubMenu(subMenu.menus, menusLinks);
            groupItems.push({
                name: subMenu.name||'分组',
                icon: subMenu.icon||null,
                open: subMenu.open||null,
                groups
            });
        }
        // 链接菜单
        else if ('link' in subMenu) {
            if (!(subMenu.link in subMenu)) {
                menusLinks[subMenu.link] = subMenu.name;
            }
            groupItems.push(subMenu);
        }
        // 菜单组名
        else {
            if (groupItems.length) {
                parsed.push({
                    name: groupName,
                    icon: groupIcon,
                    items: groupItems
                })
            }
            groupName = subMenu.name||null;
            groupIcon = subMenu.icon||null;
            groupItems = [];
        }
    });
    if (groupItems.length) {
        parsed.push({
            name: groupName,
            icon: groupIcon,
            items: groupItems
        })
    }
    return parsed;
}
// 函数式创建 el-menu, 模板无法完成各种判断
function renderGroup(_h, _v, group, top, level) {
    const items = renderItem(_h, _v, group.items, top, level);
    // 分割无 name, 直接返回菜单 items
    if (!group.name) {
        return items;
    }
    // 分割无 icon 通过 props[title] 直接返回
    const groupComponent = 'el-menu-item-group';
    if (!group.icon) {
        return _h(groupComponent, {
            attrs:{
                title: group.name
            }
        }, [items], 1)
    }
    // 分割有 icon 通过 slot 模板返回
    return _h(groupComponent, {}, [_h('template',{
        slot:"title",
    }, [
        renderMenuIcon(_h, group.icon),
        _v(group.name)
    ], 1), items], 1)
}
function renderItem(_h, _v, items, top, level) {
    return items.map((item, index) => {
        const inner = [];
        if (item.icon) {
            inner.push(renderMenuIcon(_h, item.icon))
        }
        inner.push(_v(item.name));
        // 当前菜单还有子菜单,菜单分组
        if ('groups' in item) {
            top.push(index);
            const childs = [
                _h('div', {
                    slot:"title", 
                    staticClass:"app-aside-item"
                }, inner, 1)
            ];
            const nextLevel = level + 1;
            item.groups.forEach((sub, subIndex) => {
                childs.push(renderGroup(_h, _v, sub, top.concat([subIndex]), nextLevel))
            })
            const openIndex = 'sub_' + top.join('_');
            if (item.open) {
                elMenuOpens.push(openIndex)
            }
            return _h('el-submenu', {
                attrs: {
                    index: openIndex
                }
            }, childs, 1);
        }
        // 外链, 直接使用 a 链接, 且 a 标签阻止冒泡, 不让 menu-item 选中
        if (('external' in item && item.external) || httpRegex.test(item.link)) {
            return _h('el-menu-item', {
                staticClass:"app-aside-external",
                attrs: {
                    index: item.link
                }
            }, [
                _h('a', {
                    staticClass:"app-aside-item",
                    staticStyle:{
                        "padding-left": ((level + 1) * 20) + "px"
                    },
                    attrs:{
                        href: item.link,
                        target:"_blank"
                    },
                    on:{
                        click:function($event){$event.stopPropagation();}
                    }
                }, inner, 1)
            ], 1)
        }
        // router 菜单
        return _h('el-menu-item', {
            staticClass:"app-aside-item",
            attrs: {
                index: item.link
            }
        }, inner, 1)
    })
}
function renderMenuIcon(_h, icon){
    // return _h('el-icon', {
    //     attrs:{name: icon}
    // })
    // 使用 i 标签, 可以用 elm 之外的 icon
    return _h('i', {
        staticClass: icon
    })
}
// 菜单组件
const elMenuAuto = {
    functional: true,
    render(h, ref) {
        const {data} = ref;
        const {groups, ...attrs} = data.attrs;
        data.attrs = attrs;
        return h('el-menu', data, groups)  
    }
}

// 主框架模板
let title = document.title;
title = title === '' ? '' : ' - ' + title;
export default {
    data: {
        name: null,
        activeTop: 0,
        activeMenu:'',
        asideCollapsed:false, // pc版 侧边栏是否为折叠状态
        phone:false, //是否为手机版
        asideOpend:false, //手机版 侧边栏是否为打开状态
    },
    components: {
        'el-menu-auto': elMenuAuto
    },
    computed: {
        navs() {
            return parseMenu.call(this, this.menus)
        },
        uname() {
            return this.passport.name
        }
    },
    created() {
        // 有顶级菜单, 通知 css 增加侧边栏宽度
        if (this.navs.length > 1) {
            document.documentElement.style.setProperty("--app-aside-top", 1);
        }
        // 修正 navs 选中状态, 因为进入路由页面不一定是通过点击侧边栏进入的
        // 若是侧边栏点击的, el-menu 本身就已设置好选中状态
        // 但从其他页面进来的, 或者通过带路由的 url 直接进入页面的, 就需要处理才能选中
        const setActiveMenu = (name, active) => {
            this.name = name;
            document.title = name + title;
            if (active) {
                this.activeMenu = active;
            }
        };
        this.$router.afterEach((to, from) => {
            // 点击侧边菜单导致的路由变化, 仅设置下 name 就好
            if (this.$_menusClicked) {
                setActiveMenu(to.meta.name)
                this.$_menusClicked = false;
                return;
            }
            // 从其他地方过来的
            let maybe = null;
            const find = this.$_menusLinks.some((menus, index) => {
                for (let path in menus) {
                    if (path === to.fullPath) {
                        // menus path 与 当前访问 path 完全匹配
                        this.activeTop = index;
                        setActiveMenu(menus[path], path);
                        return true;
                    }
                    // 否则尝试找一个
                    if (!maybe && to.fullPath.startsWith(path)) {
                        maybe = [index, path, menus[path]];
                    }
                }
            });
            if (!find && maybe) {
                this.activeTop = maybe[0];
                setActiveMenu(maybe[2], maybe[1]);
            }
        });
        // 给 body 添加 app-phone 来切换 pc/phone 版
        const media = window.matchMedia("(max-width: 768px)");
        const mediaChange = phone => {
            if (this.phone !== phone) {
                this.phone = phone;
                document.body.classList.toggle('app-phone', phone);
            }
        }
        media.addListener((e) => {
            if (this.phone && this.asideOpend && !e.matches) {
                this.collapse().then(() => mediaChange(false))
            } else {
                mediaChange(e.matches);
            }
        });
        mediaChange(media.matches);
        // phone版, 页面切换时关闭菜单
        this.$router.beforeEach((to, from, next) => {
            if (this.phone){
                this.collapse();
            }
            next()
        })
    },
    methods:{
        // 点击菜单 menu
        $_onMenuSelect(index){
            this.$_menusClicked = true;
            this.activeMenu = index;
        },
        // 菜单是否处于打开状态
        isExpand(){
            return this.phone ? this.asideOpend : !this.asideCollapsed;
        },
        // 打开菜单
        expand(){
            return this._setAsideStatus(true);
        },
        // 折叠菜单
        collapse(){
            return this._setAsideStatus(false);
        },
        // 切换菜单的 打开折叠状态
        toggleAside(){
            return this._setAsideStatus(this.phone ? !this.asideOpend : this.asideCollapsed);
        },
        _setAsideStatus(expand){
            const run = this.phone 
                ? (expand ? !this.asideOpend : this.asideOpend)
                : (expand ? this.asideCollapsed : !this.asideCollapsed);
            if (run) {
                if (this.phone) {
                    this.asideOpend = expand;
                } else {
                    this.asideCollapsed = !expand;
                }
            }
            return new Promise(resolve => {
                setTimeout(resolve, 300);
            })

        },
        // 切换到指定顶级菜单
        switchMenu(index) {
            this.activeTop = index;
        },
        // 退出
        logout(){
            this.$admin.confirm('确定要退出吗').then(() => {
                return this.$admin.postJson(this.$admin.config.logout)
            }).then(() => {
                location.reload()
            })
        },
    }
}
</script>

<style>
:root{
    /* 激活文字/背景 链接文字 按钮背景*/
    --color-primary:#409eff;
    --color-primary-light-1:#53a8ff;
    --color-primary-light-2:#65b1ff;
    --color-primary-light-3:#79bbff;
    --color-primary-light-4:#8dc5ff;
    --color-primary-light-5:#a0cfff;
    --color-primary-light-6:#b3d8ff;
    --color-primary-light-7:#c6e2ff;
    --color-primary-light-8:#d9ecff;
    --color-primary-light-9:#ecf5ff;

    --color-success:#67C23A;
    --color-success-light:#e1f3d8;
    --color-success-lighter:#f0f9eb;

    --color-warning:#E6A23C;
    --color-warning-light:#faecd8;
    --color-warning-lighter:#fdf6ec;

    --color-danger:#F56C6C;
    --color-danger-light:#fde2e2;
    --color-danger-lighter:#fef0f0;

    --color-info:#909399;
    --color-info-light:#e9e9eb;
    --color-info-lighter:#f4f4f5;

    /*标题 可互动但尚未激活文字颜色*/
    --color-text-primary:#303133;
    /*普通文本颜色, 即 body 默认色*/
    --color-text-regular:#606266;
    /*次要文本颜色 */
    --color-text-secondary:#909399;
    /*占位文本颜色 */
    --color-text-placeholder:#C0C4CC;

    /*表单元素 按钮等边框色 */
    --border-color-base:#DCDFE6;
    /*进度条 TAB下划线 */
    --border-color-light:#E4E7ED;
    /*弹层边框 颜色分割线 卡片边框*/
    --border-color-lighter:#EBEEF5;
    /*禁用元素边框 */
    --border-color-extra-light:#F2F6FC;

    /*标题头背景 输入框两端背景 禁用元素背景  hover背景*/
    --background-color-base:#F5F7FA;
    --color-white:#fff;

    /*阴影色*/
    --color-shadow:rgba(0, 0, 0, 0.03);
}
.app-container{
    /*头部高度,侧边栏宽度*/
    --app-header-height:48px;
    --app-aside-width:210px;
}

html{width:100%;height:100%;}
body{margin:0;width:100%;height:100%;overflow:hidden;}
.app-container{
    --app-aside-realWidth: calc(var(--app-aside-width) + var(--app-aside-top, 0) * 50px);
    width:100%;
    height:100%;
}

/* 头部
--------------------------------------*/
.app-header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding:0;
    font-size:14px;
    position:fixed;
    right: 0;
    top:0;
    height:var(--app-header-height);
    left:var(--app-aside-realWidth);
    transition: left 300ms;
    color: #909399;
}
.app-header-action{
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 28px;
    height: 28px;
    margin: 0 5px;
    border-radius: 4px;
}
.app-header-action svg{
    width: 20px;
    height: 20px;
    fill: currentColor;
}
.app-header-left{
    flex:1;
    display: flex;
    align-items: center;
}
.app-header-right{
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    padding: 0 20px 0 10px;
    display: flex;
    align-items: center;
}
.app-header-right a{
    text-decoration: underline;
    margin-right:10px;
}
.app-header-right span{
    cursor: pointer;
}
.app-header-right a,.app-header-right span:hover{
    color:#333;
}

/* 菜单
--------------------------------------*/
.app-aside{
    position: fixed;
    height: 100%;
    left: 0;
    top: 0;
    display: inline-block;
    transition: left 300ms;
}
.app-aside-mask{
    display: none;
}
.app-aside-navs{
    display: flex;
    height: 100%;
    flex-direction: row;
    user-select: none;
    width: var(--app-aside-realWidth);
}
.app-aside-top{
    width: 50px;
    height: 100%;
    background: #2C2C2C;
}
.app-aside-top ul{
    width: 100%;
    list-style: none;
    padding: 0;
    margin: 0;
}
.app-aside-top li{
    width: 100%;
    list-style: none;
    color: #b3b3b3;
    text-align: center;
    padding: 0.8em 0;
    cursor: pointer;
}
.app-aside-top li.active, .app-aside-top li:hover{
    color:#fff;
}
.app-aside-top i{
    font-size:28px;
}
.app-aside-top p{
    font-size: 12px;
    margin: 0.2em 0 0 0;
}
.app-aside-sub{
    flex: 1;
    height: 100%;
    overflow:hidden;
}
.app-aside-sub .name{
    margin: 0;
    box-sizing: border-box;
    padding-left: 21px;
    font-size: 1em;
    font-weight: normal;
    height: 52px;
    line-height: 52px;
    display: flex;
    flex-direction: row;
    align-items: center;
    color: #909399;
}
.app-aside-sub .name i{
    font-size: 1.2em;
    margin-right: 8px;
}
.app-aside-sub .navs{
    flex:1;
    overflow:hidden;
    scrollbar-width: thin;
}
.app-aside-sub .navs:hover{
    overflow-y:auto;
}
.app-aside-group{
    display: flex;
    flex-direction: column;
    height: 100%;
}
/*el-menu 背景*/
.app-aside-sub .el-menu{
    border:0;
    background: transparent;
}
.app-header-action:hover,
.app-aside-sub .el-submenu__title:hover, 
.app-aside-sub .el-menu-item:focus, 
.app-aside-sub .el-menu-item:hover {
    background-color: #f1f2f3;
}
.app-aside-sub .el-menu-item.is-active {
    background-color: #e4e5eb;
    color: #1b1b1d;
}
/*el-menu 分割小标题 icon*/
.app-aside-sub .el-menu-item-group__title i{
    width:auto;
    margin-right:4px;
    font-size: inherit;
}
/*el-menu 普通菜单及分组*/
.app-aside-item{
    display: flex;
    align-items: center;
}
.app-aside-item i{
    margin-right:8px !important;
    width:auto !important;
}
/*el-menu 外链*/
.app-aside-external a{
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    text-decoration: none;
    color: inherit;
}

/* 主体
--------------------------------------*/
.app-wrapper{
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding:var(--app-header-height) 0 0 var(--app-aside-realWidth);
    transition:padding-left 300ms;
}
.app-view{
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: auto;
    border-radius: 6px 0 0 0;
    border-left: 1px solid #cecece;
    border-top: 1px solid #cecece;
    box-shadow: -2px 1px 2px rgb(0 0 0 / 8%);
    transition-delay: 150ms;
}

/* PC版手动折叠菜单样式 / phone版默认隐藏菜单样式
--------------------------------------------*/
.app-container-full .app-header, .app-phone .app-header{
    left:0;
}
.app-container-full .app-aside, .app-phone .app-aside{
    left:calc(-1 * var(--app-aside-realWidth));
}
.app-container-full .app-wrapper, .app-phone .app-wrapper{
    padding-left:0;
}
.app-container-full .app-view, .app-phone .app-view{
    border-left:0;
    box-shadow:none;
    border-radius:0;
}

/*phone style
--------------------------------------*/
.app-phone{
    height:auto;
    overflow:auto;
}
.app-phone.el-popup-parent--hidden{
    overflow: hidden;
}
.app-phone .app-container{
    height: auto;
    padding-top:var(--app-header-height);
}
.app-phone .app-header{
    z-index:1000;
    box-shadow: 0px 0px 4px 0px rgb(0 0 0 / 15%);
    background: rgb(250 251 252 / 84%);
    backdrop-filter: blur(8px);
}
.app-phone .app-header-action{
    width: 44px;
    height: 100%;
    margin:0;
}
.app-phone .app-aside{
    z-index:1001;
}
.app-phone .app-aside-mask{
    position: absolute;
    z-index: -2;
    display: block;
    width: 100vw;
    height: 100%;
    left: var(--app-aside-realWidth);
    top:0;
    background: rgba(0,0,0,.65);
    pointer-events: none;
    opacity: 0;
    transition: opacity 300ms;
}
.app-phone .app-aside-navs{
    transition: transform 300ms;
}
.app-phone .app-aside-sub .navs{
    overflow: auto;
}
.app-phone .app-wrapper{
    padding-top: 0;
    height: auto;
}
.app-phone .app-view{
    height: auto;
    border-top:0;
}
/*phone 版弹出菜单*/
.app-aside-opend .app-aside-mask{
    pointer-events:auto;
    opacity: 1;
}
.app-aside-opend .app-aside-navs{
    transform: translateX(var(--app-aside-realWidth));
}

/*通用性样式
--------------------------------------*/
/*重置 elm ui, 将 dialog 组件改为默认宽度由 body 宽度决定*/
.el-dialog__wrapper{
    text-align: center;
    font-size: 0;
}
.el-dialog{
    text-align: left;
    display: inline-block;
    width: auto;
}
/*窄滚动条*/
.app-thin-scroll{scrollbar-width: thin;}
.app-thin-scroll::-webkit-scrollbar{width:6px}
.app-thin-scroll::-webkit-scrollbar-track{background:#fff}
.app-thin-scroll::-webkit-scrollbar-thumb{background:#CDCDCD}
.app-thin-scroll::-webkit-scrollbar-thumb:hover{background:#ACACAC}

/*单页 pc版 height:100% 即可保证铺满, 但 phone 版不行
phone 版本父级高度为 auto, 若需要在二者都铺满, 可使用该 class*/
.app-full{
    height: 100%;
}
.app-phone .app-full{
    height: calc(100vh - 48px);
}

/*为保证单页能自行控制样式，默认没有添加任何样式
但一般情况下, 主体有个 padding 看起来才舒服, 这里定义一个全局的 main 样式
如果是 form 的话, 全尺寸宽度看起来很难受, 限制其最大宽度
app-form 若是在弹出层中, 给一个最小宽度*/
.app-main{
    padding:14px;
}
.app-form{
    box-sizing: border-box;
    padding:20px;
    max-width:960px;
}
.curd-dialog .app-form{
    min-width:580px;
    padding-bottom: 8px;
}

/*当前主题基本样式
--------------------------------------*/
.app-container, .app-phone .app-aside-navs{
    background:#fafbfc;
}
.app-view{
    background: #fff;
}

/* .app-container,.app-phone .app-aside-navs{
    background: url(https://d2.pub/d2-admin/preview/image/theme/star/bg.jpg) no-repeat;
    background-size: cover;
}
.app-wrapper, .app-phone .app-aside-sub{
    background: rgb(255 255 255 / 60%);
}
.app-header{
    color:#333;
}
.app-header-right a,.app-header-right span:hover{
    color:#333;
}
.app-aside-sub .name,.app-aside-sub .el-menu-item-group__title{
    color:#999;
}
.app-aside-sub .el-menu-item,.app-aside-sub .el-submenu__title{
    color:#999;
}
.app-header-action:hover,
.app-aside-sub .el-submenu__title:hover, 
.app-aside-sub .el-menu-item:focus, 
.app-aside-sub .el-menu-item:hover {
    background-color: #f1f2f3;
}
.app-aside-sub .el-menu-item.is-active {
    background-color: #e4e5eb;
}
.app-view{
    background:#fff;
    border:0;
} */
</style>
