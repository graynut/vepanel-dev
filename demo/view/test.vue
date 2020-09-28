<template>
    <component :is="path" />
</template>

<script>
import vars from './test/vars';
const components = {
    vars,
    assets: () => requireComponent('./test/assets'),
    less: () => requireComponent('./test/less'),
    api: () => requireComponent('./test/api'),
    fetch: () => requireComponent('./test/fetch'),
    import: () => requireComponent('./test/import'),
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
            // 一级 path 不匹配, 不处理
            if (!to.name || to.name !== 'test') {
                return;
            }
            // 获取二级 path
            const secondPath = to.params.pathMatch.indexOf('/') > -1
                ? to.params.pathMatch.split('/')[1]
                : null;
            // 未指定二级 path 或 指定的二级 path 组件不存在
            if (!secondPath || !(secondPath in components)) {
                this.$router.replace(to.meta.uri + '/vars');
                //this.$admin.error(404); //也可显示404页面
                return;
            }
            this.path = secondPath;
        },
    }
}
</script>