<template>
    <div class="app-main">
        <el-card shadow="never" header="Vue.prototype.$admin">
            <el-row>
                $admin.config: {{config}}
            </el-row>
            <el-row>
                当前加载方式：<b>{{loadType}}</b>
            </el-row>
            <el-row>
                <el-button @click="$admin.reload">reload</el-button>
                <el-button type="success" @click="error">error</el-button>
                <el-button type="info" @click="alert">alert</el-button>
                <el-button type="warning" @click="confirm">confirm</el-button>
                <el-button type="danger" @click="Progress">Progress</el-button>
            </el-row>
            <el-row>
                <el-input placeholder="请输入内容" style="width:200px" v-model="apiTest"/>
                <el-button type="success" @click="setStore">setStore</el-button>
                getStore：{{storeValue}}
            </el-row>
        </el-card>

        <el-card shadow="never" header="Vue.prototype.$perms" style="margin-top:20px">
            <el-radio-group size="mini" v-model="permTest">
                <el-radio-button :label="0">一个权限(通过)</el-radio-button>
                <el-radio-button :label="1">一个权限(不通过)</el-radio-button>
                <el-radio-button :label="2">多个权限(通过)</el-radio-button>
                <el-radio-button :label="3">多个权限(不通过)</el-radio-button>
                <el-radio-button :label="4">其中一个权限(通过)</el-radio-button>
                <el-radio-button :label="5">其中一个权限(不通过)</el-radio-button>
            </el-radio-group>
            <p>{{permRs}}</p>
        </el-card>

        <el-card shadow="never" header="this.$root" style="margin-top:20px">
            <el-row>
                菜单状态：<b>{{$root.isExpand() ? '展开' : '折叠'}}</b>
            </el-row>
            <el-row>
                <el-button @click="$root.reloadMenu">reloadMenu</el-button>
                <el-button type="success" @click="$root.reloadPassport">reloadPassport</el-button>
                <el-button type="info" @click="$root.expand">expand</el-button>
                <el-button type="warning" @click="$root.collapse">collapse</el-button>
                <el-button type="danger" @click="$root.toggleAside">toggleAside</el-button>
                <el-button type="success" @click="switchMenu">switchMenu</el-button>
                <el-button @click="$root.logout">退出</el-button>
            </el-row>
        </el-card>

        <el-card shadow="never" header="路由" style="margin-top:20px">
            <router-link to="/test/vars">链接形式</router-link>
            <el-button type="text" @click="jump">API 形式</el-button>
        </el-card>
    </div> 
</template>

<script>
export default {
    data(){
        return {
            apiTest: "",
            storeValue:"",
            loadType: this.getLoadType(),
            permTest: 0,
            currentMenu:0,
        }
    },
    computed: {
        config() {
            return this.$admin.config
        },
        permRs(){
            let checked;
            switch(this.permTest) {
                case 0:
                    checked = this.$perms('foo');
                break;
                case 1:
                    checked = this.$perms('baz');
                break;
                case 2:
                    checked = this.$perms(['foo', 'bar']);
                break;
                case 3:
                    checked = this.$perms(['foo', 'baz']);
                break;
                case 4:
                    checked = this.$perms(['foo', 'baz'], true);
                break;
                case 5:
                    checked = this.$perms(['qux', 'baz'], true);
                break;
            }
            return checked ? '通过' : '不通过';
        }
    },
    activated(){
        this.loadType = this.getLoadType();
    },
    methods:{
        getLoadType(){
            const v = this.$admin.loadType();
            let loadType = '未知';
            switch(v) {
                case 0:
                    loadType = '直接打开';
                    break;
                case 1:
                    loadType = '前进按钮激活';
                    break;
                case -1:
                    loadType = '后退按钮激活';
                    break;
                case 2:
                    loadType = '页面刷新';
                    break;
            }
            return loadType;
        },
        error(){
            this.$admin.error(1001, "手动触发错误页");
        },
        alert(){
            this.$admin.alert('弹出消息, PC/Phone版不同')
        },
        confirm(){
            this.$admin.confirm('确认消息, PC/Phone版不同').then(() => {
                this.$admin.alert('您确认了')
            })
        },
        Progress(){
            this.$admin.startProgress();
            setTimeout(() => {
                this.$admin.endProgress();
            }, 1500);
        },
        setStore(){
            this.$admin.setStore('api_test', this.apiTest);
            this.storeValue = this.$admin.getStore('api_test');
        },
        switchMenu(){
            const len = this.$root.menus.length;
            if (len < 2) {
                return this.$admin.alert('只有一个菜单, 无法测试');
            }
            let newMenu = this.currentMenu + 1;
            if (newMenu >= len) {
                newMenu = 0;
            }
            this.currentMenu = newMenu;
            this.$root.switchMenu(newMenu);
        },
        jump(){
            this.$router.push('/test/vars')
        }
    }
}
</script>

<style scoped>
.app-main .el-row{
    padding:20px 0;
}
</style>