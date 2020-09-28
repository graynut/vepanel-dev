<template>
    <div class="vepanel-test">
      <div class="vepanel-flex">
        <img src="./sub/img/vue.png">
        <img src="@/asset/vepanel.png">
        <img src="~/img/logo.png">
        <img :src="foo">
        <img :src="bar">
        <img :src="biz">
        <div class="foo"></div>
        <div class="bar"></div>
        <div class="biz"></div>
        <button @click="func_foo">Foo</button>
        <button @click="func_bar">Bar</button>
        <button @click="func_utils">Utils</button>
      </div>
      <sub-test />
      <sub-async />
    </div>
</template>

<script>
import func_utils, {func_foo, func_bar} from './sub/utils';
import foo from "./sub/img/vue.png";
import bar from "@/asset/vepanel.png";
import biz from "~/img/logo.png";
import subTest from './sub/index';
const subAsync = () => requireComponent("./sub/index");

export default {
  components:{
    subTest,
    subAsync
  },
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
.vepanel-test{
  display: inline-block;
}
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
.foo{
  background:url("./sub/img/vue.png")
}
.bar{
  background:url("@/asset/vepanel.png")
}
.biz{
  background:url("~/img/logo.png")
}
</style>