<template>
    <div class="vepanel-flex">
        <img src="./img/vue.png">
        <img src="@/asset/vepanel.png">
        <img src="~/img/logo.png">
        <img :src="foo">
        <img :src="bar">
        <img :src="biz">
        <div class="foo2"></div>
        <div class="bar2"></div>
        <div class="biz2"></div>
        <button @click="func_foo">Foo</button>
        <button @click="func_bar">Bar</button>
        <button @click="func_utils">Utils</button>
    </div>
</template>

<script>
import func_utils, {func_foo, func_bar} from './utils';
import foo from "./img/vue.png";
import bar from "@/asset/vepanel.png";
import biz from "~/img/logo.png";
export default {
  data () {
    return {
      foo,
      bar,
      biz
    }
  },
  methods:{
    func_foo,
    func_bar,
    func_utils
  }
}
</script>

<style scoped>
.vepanel-flex{
  width: 270px;
  display: flex;
  flex-wrap: wrap;
}
.vepanel-flex img,.vepanel-flex div{
  width: 30px;
  height: 30px;
  background-size: cover;
}
.vepanel-flex button{
  width: 90px;
}
.foo2{
  background:url("./img/vue.png")
}
.bar2{
  background:url("@/asset/vepanel.png")
}
.biz2{
  background:url("~/img/logo.png")
}
</style>