<template>
  <div class="app-main">

    <el-card shadow="never" header="本地组件">
      <middle />
    </el-card>

    <el-card shadow="never" header="本地函数" style="margin-top:20px">
      <el-button type="success" @click="foo">Foo</el-button>
      <el-button type="warning" @click="bar">Bar</el-button>
      <el-button type="danger" @click="utils">Utils</el-button>
    </el-card>

  </div>
</template>

<script>
import middle from './../fixtures/Middle';
import utils, {foo, bar} from './../fixtures/utils';

export default {
  components:{
    middle
  },
  methods:{
    foo,
    bar,
    utils
  }
}
</script>
