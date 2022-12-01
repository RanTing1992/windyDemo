<template>
  <div>
    <div class="container">
      <el-button @click="go('webgl')">webgl绘制</el-button>
      <el-button @click="go('canvas')">canvas绘制</el-button>
      <el-button @click="go('echart')">echart图层绘制</el-button>
      <el-button @click="go('cesium')">cesium三维地图绘制风向图</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const go = (path) => {
  router.push({ name: `${path}Draw` });
};
</script>
<style lang="scss" scoped>
.container {
  width: 100%;
  height: 500px;
  background-color: aqua;
  padding-top: 250px;
}
</style>
