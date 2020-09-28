<template>
    <div class="app-form">
        <app-loading v-if="loading"/>
        <curd-form v-bind="form" ref="curdForm" @submit="onSubmit" v-else/>
    </div> 
</template>

<script>
import curd from 'curd';

export default {
    components:{
        curdForm:curd.curdForm,
    },
    data(){
        return {
            loading:true,
            form:{}
        }
    },
    watch:{
        '$route': {
            handler: 'loadForm',
            immediate: true
        }
    },
    methods:{
        loadForm(to){
            // path 不匹配, 不处理
            const path = to.fullPath.split('/');
            if (path[1] !== 'mform') {
                return;
            }
            // 即为当前, 不做处理
            const id = parseInt(path[2]);
            if (id === this.$_id) {
                return;
            }
            // 已加载过, 从缓存拉取
            if (!this.$_formCache) {
                this.$_formCache = {};
            }
            if (id in this.$_formCache) {
                this.loading = true;
                this.$nextTick(() => {
                    this.$_id = id;
                    this.form = this.$_formCache[id];
                    this.loading = false;
                })
                return;
            }
            // 从数据库获取配置
            this.loading = true;
            this.$admin.fetchJson('form/get?id='+id).then(form => {
                this.$_id = id;
                this.form = form;
                this.$_formCache[id] = form;
                this.loading = false;
            })
        },
        onSubmit(data, done){
            console.log(data)
            setTimeout(done, 1200)
        }
    }
}
</script>

<script mock>
export default {
    'form/get': (res, req, {db}) => {
        const query = (new URL(req.url)).searchParams,
            id = query.has('id') ? parseInt(query.get('id')) : 0;
        if (!id) {
            return res.send({
                code:400,
                message:'请求 ID 未指定'
            })
        }
        let getForms;
        try {
            getForms = db.table('custom_form').where('id').equals(id).last()
        } catch(e) {
            getForms = Promise.reject('table custom_form not exist');
        }
        return getForms.then(r => {
            return res.send({
                code:0,
                data:r.form
            })
        }).catch(err => {
            return res.send({
                code:400,
                message:'获取表单数据失败'
            })
        })
    }
}
</script>