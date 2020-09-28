<template>
    <curd-maker :form="form" ref="maker" edit-model>
        <template #tools>
            <span>
                <el-button type="text" @click="clear">清空</el-button>
                <el-button type="text" @click="preview">预览</el-button>
                <el-button type="text" @click="save">保存</el-button>
            </span>
        </template>
    </curd-maker>
</template>

<script>
import curdMaker from 'curd-maker';

export default {
    components:{
        curdMaker:curdMaker.curdMaker,
    },
    data(){
        return {
            form:{}
        }
    },
    methods:{
        clear(){
            this.$refs.maker.clear();
        },
        preview(){
            this.$refs.maker.preview();
        },
        save(){
            const form = this.$refs.maker.getForm();
            if (!form.fields.length) {
                this.$admin.alert('表单为空')
                return;
            }
            this.$prompt('请输名称 (将保存到 Web SQL)', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPlaceholder:'最好是 3 ~ 5 个字符',
                inputPattern: /\s*\S+?/,
                inputErrorMessage: '名称不能为空'
            }).then(({ value }) => {
                value = value.trim();
                this.$admin.postJson('form/save', {name:value, form}).then(r => {
                    this.$root.reloadMenu();
                })
            }).catch(() => {
            });
        }
    }
}
</script>

<script mock>
export default {
    '#': ({db}) => {
        return db.scheme({
            custom_form: "++id,name,form",
        })
    },
    'form/save': (res, req, {db}) => {
        return req.json().then(json => {
            return db.table('custom_form').add(json)
        }).then(data => {
            return res.send({
                code:0,
                message:'成功保存数据',
                data:'ok'
            })
        }).catch(err => {
            return res.send({
                code:500,
                message:'保存数据失败'
            })
        })
    }
}
</script>

<script mock>
export default {
    '#': ({db}) => {
        return db.scheme({
            custom_form: "++id,name,form",
        })
    },
    'form/save': (res, req, {db}) => {
        return req.json().then(json => {
            return db.table('custom_form').add(json)
        }).then(data => {
            return res.send({
                code:0,
                message:'成功保存数据',
                data:'ok'
            })
        }).catch(err => {
            return res.send({
                code:500,
                message:'保存数据失败'
            })
        })
    }
}
</script>