<template>
    <div class="app-main">

        <el-card shadow="never" header="$admin.fetch 测试">
            <el-row>
                通过 this.$admin.fetchJson 请求服务端，会自动在顶部显示加载条，若请求错误，自动显示错误页面。
            </el-row>
            <el-row>
                <el-button type="primary" @click="testGet('fetch_yes')">成功的 GET 请求</el-button>
                <el-button type="warning" @click="testGet('fetch_no')">失败的 GET 请求</el-button>
                <el-button type="warning" @click="testGet('fetch_404')">GET 404</el-button>
                <el-checkbox v-model="errorGet">强制在失败时弹窗</el-checkbox>
                测试结果：{{infoGet}}
            </el-row>

            <el-row>
                通过 this.$admin.postJson 请求服务端，同样的会显示加载条，但请求失败以弹窗形式提示。
            </el-row>
            <el-row>
                <el-button type="primary" @click="testPost('fetch_yes')">成功的 POST 请求</el-button>
                <el-button type="warning" @click="testPost('fetch_no')">失败的 POST 请求</el-button>
                <el-button type="warning" @click="testPost('fetch_404')">POST 404</el-button>
                <el-checkbox v-model="errorPost">强制在失败时显示错误页</el-checkbox>
                测试结果：{{infoPost}}
            </el-row>

            <el-row>
                <el-button type="primary" @click="testGuard">禁用预处理</el-button>
                测试结果：{{infoFull}}
            </el-row>

            <el-row>
                <el-button type="primary" @click="testHandleError">自行 handle 异常</el-button>
                测试结果：{{infoError}}
            </el-row>

            <el-row>
                模拟数据测试，在开发版和生产版的返回结果是不同的
            </el-row>
            <el-row>
                <el-button type="primary" @click="testMock">测试 mock</el-button>
                测试结果：{{infoMock}}
            </el-row>
        </el-card>

    </div>
</template>

<script>
export default {
    data(){
        return {
            errorGet:false,
            errorPost:false,
            infoGet:null,
            infoPost:null,
            infoFull:null,
            infoError:null,
            infoMock:null,
        }
    },
    methods:{
        // get 测试
        testGet(url){
            this.$admin.fetchJson(url, {
                alertError:this.errorGet ? true : null
            }).then(r => {
                this.infoGet = r;
            })
        },

        // post 测试
        testPost(url){
            // postJson 不支持 init 参数, 所以使用 fetch
            if (this.errorPost) {
                this.$admin.fetch(url, {
                    method: "POST",
                    alertError: false
                }, true).then(r => {
                    this.infoPost = r;
                })
                return;
            }
            this.$admin.postJson(url).then(r => {
                this.infoPost = r;
            })
        },

        // 禁用预处理
        testGuard(){
            this.$admin.fetchJson('fetch_yes', {
                guard:false
            }).then(r => {
                this.infoFull = r;
            })
        },

        // 自行处理加载异常
        testHandleError(){
            this.$admin.fetchJson('fetch_no', {
                handleError:false, 
            }).catch(err => {
                console.log(err)
                this.infoError = err;
            })
        },

        // Mock 数据测试
        testMock(){
            this.$admin.fetchJson('fetch_mock').then(r => {
                this.infoMock = r;
            })
        }
    }
}
</script>

<style scoped>
.app-main .el-row{
    padding:20px 0;
}
</style>

<script mock>
const yes = {
    code:0,
    data:{msg:"加载成功"}
}, no = {
    code:1000,
    message:"加载失败提示信息"
};
export default {
    '#fetch_yes': yes,
    'fetch_yes':yes ,
    
    '#fetch_no': no,
    'fetch_no': no,

    '#fetch_mock':{
        code:0,
        data:{
            msg: "真实加载"
        }
    },
    'fetch_mock': [(res) => {
        return res.send({
            code:0,
            data:{
                msg: "Mock加载"
            }
        })
    }, 500],
}
</script>