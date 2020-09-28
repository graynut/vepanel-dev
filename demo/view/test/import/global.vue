<template>
    <div class="app-full">

        <vue-star animate="animated rubberBand" color="#F05654" style="position:relative">
           <i slot="icon" class="el-icon-sunny" style="font-size:3em"/>
        </vue-star>
        
        <p>测试在 loader.js 注册的全局组件</p>

    </div> 
</template>

<style scoped>
.app-full{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
</style>