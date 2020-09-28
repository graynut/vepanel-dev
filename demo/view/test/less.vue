<template>
    <div class="app-main">
       <div class="test less-test">LESS 测试</div>
    </div> 
</template>

<style lang="less" scoped>
@import "./fixtures/test.less";
@height: 80px;
.test{
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eee;
    height: @height;
}
</style>