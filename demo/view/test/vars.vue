<template>
    <div class="app-main">
        <el-card shadow="never" header="用户信息">
            this.$root.passport : {{passport}}
        </el-card>
        <el-card shadow="never" header="菜单数据" style="margin-top:20px">
            this.$root.menus : {{menus}}
        </el-card>
    </div> 
</template>

<script>
export default {
    computed: {
        passport() {
            return this.$root.passport
        },
        menus() {
            return this.$root.menus
        },
    },
}
</script>