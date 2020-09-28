<template>
    <dl class="app-error">
        <dt><svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><path d="M896 540.992V113.792C896 50.944 838.72 0 768 0H128C57.28 0 0 50.944 0 113.792v796.416C0 973.056 57.28 1024 128 1024h644.096v-64H128c-36.928 0-64-24.064-64-49.792V113.792C64 88.064 91.072 64 128 64h640c36.928 0 64 24.064 64 49.792v427.2h64z m0 30.72V113.728C896 50.944 838.72 0 768 0H128C57.28 0 0 50.944 0 113.792v796.416C0 973.056 57.28 1024 128 1024h644.096v-64H128c-36.928 0-64-24.064-64-49.792V113.792C64 88.064 91.072 64 128 64h640c36.928 0 64 24.064 64 49.792v427.2l64 30.72zM876.608 840.384a25.6 25.6 0 1 1-36.224 36.224l-180.992-180.992a25.6 25.6 0 1 1 36.224-36.224l180.992 180.992zM695.616 876.608a25.6 25.6 0 1 1-36.224-36.224l180.992-180.992a25.6 25.6 0 1 1 36.224 36.224l-180.992 180.992z"></path><path d="M192 320a32 32 0 0 1 0-64h512a32 32 0 1 1 0 64H192z m0 192a32 32 0 0 1 0-64h384a32 32 0 0 1 0 64H192z m0 192a32 32 0 1 1 0-64h192a32 32 0 1 1 0 64H192z m576 256a192 192 0 1 0 0-384 192 192 0 0 0 0 384z m0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512z"></path></svg></dt>
        <dd>
            <h2>{{code}}</h2>
            <h3>{{message}}</h3>
            <div class="btns">
                <el-button type="primary" @click="home">返回首页</el-button>
                <el-button type="info" @click="realod">刷新</el-button>
            </div>
        </dd>
    </dl>
</template>


<script>
/**
 * 错误页会注入 {type, code, text} 三个变量
 * type=0  访问不存在路由
 * type=1  异步加载页面 js 组件时发生错误
 * type=2  由 $admin.error 触发的错误
 *
 * code - 错误码
 * text - 错误信息
 */
export default {
    computed: {
        message() {
            if (this.text) {
                return this.text;
            }
            if (this.code === 404) {
                return '您执行的操作不存在';
            }
            if (this.code === 600) {
                return '前端资源错误';
            }
            return '发生了未知错误';
        }
    },
    methods:{
        home() {
            this.$router.push('/')
        },
        realod() {
            this.$admin.reload()
        }
    },
}
</script>

<style>
.app-error{
    box-sizing: border-box;
    width: 100%;
    height: calc(100vh - 80px);
    padding:0 20px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.app-error svg{
    display: inline-block;
}
.app-error dt{
    font-size: 15em;
    line-height: 0;
    color: #bbc2ca;
}
.app-error dd{
    min-width:190px;
    max-width: 40%;
    margin: 0 0 0 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.app-error h2{
    font-size: 6em;
    margin: 0;
    line-height: 1;
    color: #81888e;
}
.app-error h3{
    color: #b1b8c1;
    font-weight: normal;
    margin: 10px 0;
}
.app-error .btns{
    margin-top:40px;
}

.app-phone .app-error{
    flex-direction: column;
}
.app-phone .app-error dt{
    font-size: 12em;
}
.app-phone .app-error dd{
    margin: 30px 0 0 0;
    text-align: center;
}
</style>
