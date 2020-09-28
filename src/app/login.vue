<template>
    <div class="logigWrp">
        <div class="loginForm">
            <h1>管理中心</h1>
            <el-form :model="loginData" :rules="rules" ref="loginForm">
                <el-form-item prop="user">
                    <el-input type="text" v-model="loginData.user" prefix-icon="el-icon-user" placeholder="账号" autocomplete="off" @keyup.enter.native="login"/>
                </el-form-item>
                <el-form-item prop="pwd">
                    <el-input type="password" v-model="loginData.pwd"  prefix-icon="el-icon-lock"  placeholder="密码" autocomplete="off" @keyup.enter.native="login"/>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" style="width:100%" @click="login">登录</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="loginPlace"></div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            loginData: {
                user:'',
                pwd: ''
            },
            rules: {
                user: { required: true, message: '请输入登录账号' },
                pwd:{ required:true, message: '请输入登录密码' },
            }
        };
    },
    created() {
        const media = window.matchMedia("(max-width: 600px)");
        this.$admin.setStore('phone', media.matches)
        media.addListener((e) => {
            this.$admin.setStore('phone', e.matches)
        });
    },
    methods: {
        login(e) {
            e.target.blur()
            this.$refs.loginForm.validate((valid) => {
                if (!valid) {
                    return false;
                }
                this.$admin.postJson(this.$admin.config.login, this.loginData).then(res => {
                    location.reload()
                })
            });
        }
    }
}
</script>

<style>
html,body{
    width:100%;
    height:100%;
    margin:0;
}
body{
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    background-color: #fbfbfb;
}
.logigWrp{    
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}
.loginForm{
    box-sizing: border-box;
    width: 460px;
    flex-shrink: 0;
    padding: 20px;
    padding-top: 0;
    border-radius: 10px;
    background: rgb(255 255 255 / 65%);
    backdrop-filter: blur(8px);
    box-shadow: 0 0 3px rgb(0 0 0 / 25%);
}
.loginForm h1{
    color: #4c4c4c;
    text-align: center;
}
.loginPlace{
    height: 30%;
}
@media screen and (max-width:490px) {
    .loginForm{
        width: 100%;
    }
}
</style>
