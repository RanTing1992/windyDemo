<template>
  <div id="map-container">
    <div id="container" class="full"></div>
    <div class="right-info">
      <p>fps:{{}}</p>
      <div class="slider-demo-block">
        <span class="demonstration">粒子数</span>
        <el-slider
          v-model="particlesNumber"
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
  </div>
</template>
<script setup>
import {
  Viewer,
  Cartesian2,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  CesiumTerrainProvider,
  ArcGisMapServerImageryProvider,
  Cartesian3,
} from "Cesium";
import { onMounted, ref, watch } from "vue";
import CesiumWindy from "../../utils/cesiumWindy/cesiumWindy.js";
const particlesNumber = ref(10000);
const radio = ref(3);
const globalExtent = ref([]);
let viewer = null;
let windy = null; //全局windy实例
let windycanvas = null; //风场的canvas
let particlesNumberChangeTimer = null;
//创建装风场的canvas
function createCanvas() {
  windycanvas = document.createElement("canvas");
  windycanvas.setAttribute("id", "windycanvas");
  windycanvas.style.position = "fixed";
  windycanvas.style["pointer-events"] = "none";
  windycanvas.style["z-index"] = 10;
  windycanvas.style["top"] = 0;
  windycanvas.style["left"] = 0;
  document.getElementById("map-container").appendChild(windycanvas);
}
async function initWindy() {
  // 开启监听器--无论对当前地球做的任何操作都会监听到
  let postRender = viewer.scene.postRender.addEventListener(() => {
    getCesiumExtent();
  });
  var refreshTimer = -1;
  var mouse_down = false;
  var mouse_move = false;
  var handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  //鼠标滚动、旋转后是否需要重新生成风场---如果需要，打开以下注释--旋转或者移动到北半球的时候计算会有问题
  handler.setInputAction(function (e) {
    clearTimeout(refreshTimer);
    hideWindy();
    setTimeout(function () {
      windy.extent = globalExtent.value;
      windy.redraw();
      showWindy();
    }, 200);
  }, ScreenSpaceEventType.WHEEL);
  //鼠标左键、右键按下
  handler.setInputAction(function (e) {
    mouse_down = true;
  }, ScreenSpaceEventType.LEFT_DOWN);
  handler.setInputAction(function (e) {
    mouse_down = true;
  }, ScreenSpaceEventType.RIGHT_DOWN);
  //鼠标移动
  handler.setInputAction(function (e) {
    if (mouse_down) {
      hideWindy();
      mouse_move = true;
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);
  //鼠标左键、右键抬起
  handler.setInputAction(function (e) {
    if (mouse_down && mouse_move) {
      windy.extent = globalExtent.value;
      windy.redraw();
    }
    showWindy();
    mouse_down = false;
    mouse_move = false;
  }, ScreenSpaceEventType.LEFT_UP);
  handler.setInputAction(function (e) {
    if (mouse_down && mouse_move) {
      windy.extent = globalExtent.value;
      windy.redraw();
    }
    showWindy();
    mouse_down = false;
    mouse_move = false;
  }, ScreenSpaceEventType.RIGHT_UP);
  let resizeCanvas = function () {
    if (windycanvas == null) {
      return;
    }
    windycanvas.width = window.innerWidth;
    windycanvas.height = window.innerHeight;
    console.log(windycanvas.width, windycanvas.height);
    if (windy) {
      windy._resize(windycanvas.width, windycanvas.height);
    }
  };
  const data = await getData();
  resizeCanvas();
  window.onresize = resizeCanvas;
  //风场的参数配置，除了canvas/viewer是必传项，其他可以不传，参数含义见windy.js
  var params = {
    viewer: viewer,
    canvas: windycanvas,
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    speedRate: 5000,
    particlesNumber: particlesNumber.value,
    maxAge: 120,
    frameRate: 10,
    color: "#ffffff",
    lineWidth: 1,
  };
  windy = new CesiumWindy(data, params);
}
//获取风场数据
function getData() {
  return new Promise((resolve, reject) => {
    fetch("/data/data.json", {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("获取的风场数据");
        resolve(data);
      })
      .catch((err) => {
        console.log(err, "获取数据失败");
        reject({ err: "获取数据失败" });
      });
  });
}
function showWindy() {
  // if (windycanvas) {
  //   console.log(windycanvas, "哈哈哈哈哈这个是什么鬼？");
  //   windycanvas.style.display = "block";
  // }
}
function hideWindy() {
  // if (windycanvas) {
  //   windycanvas.style.display = "none";
  // }
}

//获取当前三维窗口左上、右上、左下、右下坐标
function getCesiumExtent() {
  console.log("获取三维窗口坐标");
  let canvaswidth = window.innerWidth,
    canvasheight = window.innerHeight - 50;

  let left_top_pt = new Cartesian2(0, 0);
  let left_bottom_pt = new Cartesian2(0, canvasheight);
  let right_top_pt = new Cartesian2(canvaswidth, 0);
  let right_bottom_pt = new Cartesian2(canvaswidth, canvasheight);

  let pick1 = viewer.scene.globe.pick(
    viewer.camera.getPickRay(left_top_pt),
    viewer.scene
  );
  let pick2 = viewer.scene.globe.pick(
    viewer.camera.getPickRay(left_bottom_pt),
    viewer.scene
  );
  let pick3 = viewer.scene.globe.pick(
    viewer.camera.getPickRay(right_top_pt),
    viewer.scene
  );
  let pick4 = viewer.scene.globe.pick(
    viewer.camera.getPickRay(right_bottom_pt),
    viewer.scene
  );
  if (pick1 && pick2 && pick3 && pick4) {
    //将三维坐标转成地理坐标---只需计算左下右上的坐标即可
    let geoPt1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick2);
    let geoPt2 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick3);
    //地理坐标转换为经纬度坐标
    let point1 = [
      (geoPt1.longitude / Math.PI) * 180,
      (geoPt1.latitude / Math.PI) * 180,
    ];
    let point2 = [
      (geoPt2.longitude / Math.PI) * 180,
      (geoPt2.latitude / Math.PI) * 180,
    ];
    // console.log(point1,point2);
    //此时说明extent需要分为东西半球
    if (point1[0] > point2[0]) {
      globalExtent.value = [
        point1[0],
        180,
        point1[1],
        point2[1],
        -180,
        point2[0],
        point1[1],
        point2[1],
      ];
    } else {
      globalExtent.value = [point1[0], point2[0], point1[1], point2[1]];
    }
  } else {
    globalExtent.value = [];
  }
}
//粒子变化调用重新绘制风场
function sliderChange(val) {}
//粒子个数变化的时候重新绘制
watch(particlesNumber, (val) => {
  if (windy) {
    particlesNumberChangeTimer && clearTimeout(particlesNumberChangeTimer);
    windy.particlesNumber = val;
    particlesNumberChangeTimer = setTimeout(function () {
      windy.redraw();
    }, 500);
  }
});
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
onMounted(() => {
  //初始化cesium
  viewer = new Viewer("container", {
    //组件的隐藏与显示
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    animation: false,
    shouldAnimate: true,
    //creditContainer:"credit",
    timeline: false,
    fullscreenButton: false,
    vrButton: false,
    // terrainProvider: new CesiumTerrainProvider({
    //   url: "http://211.101.24.58:1951/irrlicht/services/samples/c3d_wenchang_terrain/C3DTerrainServer/data",
    // }),
    // imageryProvider: new ArcGisMapServerImageryProvider({
    // url : 'data/worldimage/{z}/{x}/{y}.png',      //如果为本地相对路径，url为文件夹地址,
    // url: "http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
    // }),
  });
  viewer.cesiumWidget.creditContainer.style.display = "none";
  viewer.scene.debugShowFramesPerSecond = true;
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.camera.setView({
    destination: new Cartesian3.fromDegrees(107.515637, 31.105743, 22844209),
  });
  createCanvas();
  initWindy();
});
</script>
<style lang="scss" scoped>
#map-container {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
}
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
