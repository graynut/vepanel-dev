<template>
    <div class="app-main assets">

        <el-card shadow="never" header="Template 中使用静态资源">
          <img src="./asset/vue.png">
          <img src="@/asset/vepanel.png">
          <img src="~/img/logo.png">
        </el-card>

        <el-card shadow="never" header="Script 中使用静态资源" style="margin-top:20px">
          <img :src="foo">
          <img :src="bar">
          <img :src="biz">
        </el-card>

        <el-card shadow="never" header="CSS 中使用静态资源" style="margin-top:20px">
          <div class="foo"></div>
          <div class="bar"></div>
          <div class="biz"></div>
        </el-card>

    </div>
</template>

<script>
import foo from "./asset/vue.png";
import bar from "@/asset/vepanel.png";
import biz from "~/img/logo.png";
export default {
  data () {
    return {
      foo,
      bar,
      biz
    }
  }
}
</script>

<style scoped>
.foo,.bar,.biz{
  display: inline-block;
  width: 200px;
  height: 200px;
}
.foo{
  background:url("./asset/vue.png")
}
.bar{
  background:url("@/asset/vepanel.png")
}
.biz{
  background:url("~/img/logo.png")
}
</style>