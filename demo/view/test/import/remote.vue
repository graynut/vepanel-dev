<template>
  <div class="app-main">

    <el-card shadow="never" header="公共库组件">
      <clock color="#4AB7BD"/>
      <vepanel-test />
    </el-card>

    <el-card shadow="never" header="公共库函数" style="margin-top:20px">
      <el-row>
        <el-button type="success" @click="guuid1">UUID V1</el-button>
        <span>{{uqidV1}}</span>
      </el-row>
      <el-row>
        <el-button type="success" @click="guuid4">UUID V4</el-button>
        <span>{{uqidV4}}</span>
      </el-row>
      <el-row>
        <el-button type="success" @click="guuid5">UUID V5</el-button>
        <span>{{uqidV5}}</span>
      </el-row>
    </el-card>

    <el-card shadow="never" header="自定义库组件" style="margin-top:20px">
      <div class="testmenu" @contextmenu.prevent="$refs.ctxMenu.open"> 点击右键查看 </div>
      <context-menu ref="ctxMenu">
        <li>option 1</li>
        <li class="disabled">option 2</li>
        <li>option 3</li>
      </context-menu>
    </el-card>

    <el-card shadow="never" header="自定义库函数" style="margin-top:20px">
      <el-row>
        <el-button type="success" @click="updateNow">underscore.now</el-button>
        <span>{{now}}</span>
      </el-row>
      <el-row>
        <el-button type="success" @click="testThrottle">throttle</el-button>
        <span>{{throttleId}}</span>
      </el-row>
    </el-card>

    <el-card shadow="never" header="远程组件" style="margin-top:20px">
      <countdown :end="countdownEnd" />
    </el-card>

    <el-card shadow="never" header="远程函数" style="margin-top:20px">
      <el-row>
        <el-button type="success" @click="testRandom">随机数</el-button>
        <span>{{randomNum}}</span>
      </el-row>
    </el-card>

  </div>
</template>

<script>
// 测试加载公共库 组件/函数/独立文件
import clock from 'clock';
import {vepanelTest} from 'vepanel-test';
import uuid, {v4 as uuidV4} from 'uuid';
import uuidV1 from 'uuid/v1';


// 测试自定义库 组件/函数/独立文件
const contextMenu = () => requireComponent("npm!vue-context-menu@2.0.6");
import underscore from 'name!underscore:npm!underscore@1.11.0';
import throttle from 'npm!underscore@1.11.0/amd/throttle';


// 测试加载远程 组件/函数/独立文件
const countdown = () => requireComponent("name!vuejs-countdown:https://cdn.jsdelivr.net/npm/vuejs-countdown@0.2.1/dist/vuejs-countdown.js");
import random from 'https://cdn.jsdelivr.net/npm/underscore@1.11.0/amd/random.js';

function uuidV5(){
  return uuid.v5('test', uuid.v1())
}

const components = {
  // 同步组件
  clock,
  vepanelTest,

  // 异步组件
  contextMenu,
  countdown,
}

export default {
  components,
  data() {
    return {
      uqidV1: uuidV1(),
      uqidV4: uuidV4(),
      uqidV5: uuidV5(),
      now: underscore.now(),
      throttleId: 0,
      countdownEnd: new Date(Date.now() + (24 * 60 * 60 * 1000)).toString(),
      randomNum: random(0, 1000),
    }
  },
  methods:{
    guuid1(){
      this.uqidV1 = uuidV1();
    },
    guuid4(){
      this.uqidV4 = uuidV4();
    },
    guuid5(){
      this.uqidV5 = uuidV5();
    },
    updateNow(){
      this.now = underscore.now();
    },
    testThrottle(){
      const test = () => {
        this.throttleId = this.throttleId+1;
      };
      throttle(test, 500)();
    },
    testRandom(){
      this.randomNum = random(0, 1000);
    }

  }

}
</script>

<style scoped>
.app-main .el-row{
    padding:20px 0;
}
.testmenu{
  user-select: none;
  background: #000;
  color: #fff;
  display: inline-block;
  padding:10px;
}
</style>