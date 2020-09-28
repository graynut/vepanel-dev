<template>
    <component :is="path" />
</template>

<script>
// 测试一下 多层目录 的异步加载, 一般不建议多层嵌套
const components = {
    global: () => requireComponent("./import/global", true),
    remote: () => requireComponent("./import/remote", true),
    local: () => requireComponent("./import/local", true),
};
export default {
    components,
    data(){
        return {
            path: null
        }
    },
    watch: {
        '$route': {
            handler: '$_onRouterChange',
            immediate: true
        }
    },
    methods:{
        $_onRouterChange(to){
            // 不匹配, 不处理
            if (!to.path.startsWith('/test/import')) {
                return;
            }

            // 获取三级 path
            let path = to.path.split('/');
            path = path.length > 3 ? path[3] : null;

            // 未指定三级 path 或 指定的三级 path 组件不存在,显示404页面
            if (!path || !(path in components)) {
                this.$admin.error(404); 
                return;
            }
            this.path = path;
        },
    }
}
</script>