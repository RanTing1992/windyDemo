<template>
  <canvas id="windycanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
  <div id="container" class="full"></div>
  <div class="right-info">
    <p>fps:{{}}</p>
    <div class="slider-demo-block">
      <span class="demonstration">粒子数</span>
      <el-slider
        v-model="value1"
        :min="2000"
        :max="100000"
        :step="1000"
        @change="sliderChange"
      />
    </div>
    <el-radio-group v-model="radio" size="small">
      <el-radio-button :label="3">canvas绘制</el-radio-button>
      <el-radio-button :label="6">primitives绘制</el-radio-button>
    </el-radio-group>
  </div>
</template>
<script setup>
import { Viewer } from "Cesium";
import { onMounted, ref, watch } from "vue";
import CesiumWindy from "../../utils/cesiumWindy/cesiumWindy.js";
const value1 = ref(0);
const radio = ref(3);
onMounted(() => {
  const viewer = new Viewer("container");
  viewer.cesiumWidget.creditContainer.style.display = "none";
  viewer.scene.globe.depthTestAgainstTerrain = true;
  const windycanvas = document.getElementById("windycanvas");
  let windy;
  fetch("/data/windydata.json", {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("获取的风场数据", data);
      windy = new CesiumWindy(data, { viewer, canvas: windycanvas });
    })
    .catch((err) => {
      console.log(err, "获取数据失败");
    });
});
const sliderChange = (val) => {
  //粒子变化调用重新绘制风场
};
watch(radio, (val) => {
  //清除所有图层

  if (val === 3) {
    //使用调用canvas图层绘制方法
    return;
  }
  if (val === 6) {
    //使用调用primitives绘制方法

    return;
  }
});
</script>
<style lang="scss" scoped>
.full {
  width: 100%;
  height: 100%;
  background-color: bisque;
}
.right-info {
  width: 250px;
  height: 350px;
  position: absolute;
  left: 10px;
  top: 20px;
  background-color: rgba(15, 103, 114, 0.5);
  padding: 20px;
  color: #fff;
}
.color-white {
  color: #fff;
}
.slider-demo-block {
  display: flex;
  align-items: center;
}
.slider-demo-block .el-slider {
  margin-top: 0;
  margin-left: 12px;
}
.slider-demo-block .demonstration {
  font-size: 14px;
  color: #fff;
  line-height: 44px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0;
}
.slider-demo-block .demonstration + .el-slider {
  flex: 0 0 70%;
}
</style>
