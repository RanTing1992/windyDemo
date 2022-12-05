<template>
  <div id="body_div" class="body_div">
    <div id="mapDiv"></div>
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
const value1 = ref(0);
const radio = ref(3);
let viewer = null;
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
onMounted(async () => {
  //初始化cesium
  viewer = new Viewer("mapDiv", {
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
  //wind相关
  /**
   *如果处于全球状态就设置为[]（只要有一个角获取不到坐标就表示全球状态，实时计算）
   **/
  var globalExtent = [];
  var showWindy = function () {};
  var hideWindy = function () {};
  //获取当前三维窗口左上、右上、左下、右下坐标
  var getCesiumExtent = function () {
    var canvaswidth = window.innerWidth,
      canvasheight = window.innerHeight - 50;

    var left_top_pt = new Cartesian2(0, 0);
    var left_bottom_pt = new Cartesian2(0, canvasheight);
    var right_top_pt = new Cartesian2(canvaswidth, 0);
    var right_bottom_pt = new Cartesian2(canvaswidth, canvasheight);

    var pick1 = viewer.scene.globe.pick(
      viewer.camera.getPickRay(left_top_pt),
      viewer.scene
    );
    var pick2 = viewer.scene.globe.pick(
      viewer.camera.getPickRay(left_bottom_pt),
      viewer.scene
    );
    var pick3 = viewer.scene.globe.pick(
      viewer.camera.getPickRay(right_top_pt),
      viewer.scene
    );
    var pick4 = viewer.scene.globe.pick(
      viewer.camera.getPickRay(right_bottom_pt),
      viewer.scene
    );
    if (pick1 && pick2 && pick3 && pick4) {
      //将三维坐标转成地理坐标---只需计算左下右上的坐标即可
      var geoPt1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick2);
      var geoPt2 = viewer.scene.globe.ellipsoid.cartesianToCartographic(pick3);
      //地理坐标转换为经纬度坐标
      var point1 = [
        (geoPt1.longitude / Math.PI) * 180,
        (geoPt1.latitude / Math.PI) * 180,
      ];
      var point2 = [
        (geoPt2.longitude / Math.PI) * 180,
        (geoPt2.latitude / Math.PI) * 180,
      ];
      // console.log(point1,point2);
      //此时说明extent需要分为东西半球
      if (point1[0] > point2[0]) {
        globalExtent = [
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
        globalExtent = [point1[0], point2[0], point1[1], point2[1]];
      }
    } else {
      globalExtent = [];
    }
  };
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
      windy.extent = globalExtent;
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
      windy.extent = globalExtent;
      windy.redraw();
    }
    showWindy();
    mouse_down = false;
    mouse_move = false;
  }, ScreenSpaceEventType.LEFT_UP);
  handler.setInputAction(function (e) {
    if (mouse_down && mouse_move) {
      windy.extent = globalExtent;
      windy.redraw();
    }
    showWindy();
    mouse_down = false;
    mouse_move = false;
  }, ScreenSpaceEventType.RIGHT_UP);

  var windy = null,
    windycanvas = null;
  var resizeCanvas = function () {
    if (windycanvas == null) {
      return;
    }
    windycanvas.width = window.innerWidth;
    windycanvas.height = window.innerHeight;
    if (windy) {
      windy._resize(windycanvas.width, windycanvas.height);
    }
  };
  var windycanvas = document.createElement("canvas");
  windycanvas.setAttribute("id", "windycanvas");
  windycanvas.style.position = "fixed";
  windycanvas.style["pointer-events"] = "none";
  windycanvas.style["z-index"] = 10;
  windycanvas.style["top"] = 0;
  windycanvas.style["left"] = 0;
  document.getElementById("body_div").appendChild(windycanvas);
  const data = await getData();
  //风场的参数配置，除了canvas/viewer是必传项，其他可以不传，参数含义见windy.js
  var params = {
    viewer: viewer,
    canvas: windycanvas,
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    speedRate: 5000,
    particlesNumber: 10000,
    maxAge: 120,
    frameRate: 10,
    color: "#ffffff",
    lineWidth: 1,
  };
  resizeCanvas();
  window.onresize = resizeCanvas;
  windy = new CesiumWindy(data, params);
});
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
</script>
<style lang="scss" scoped>
@charset "utf-8";
/* CSS Document */
body,
html {
  font-size: 12px;
  font-family: "微软雅黑";
  background-color: #f2f2f2;
}
* {
  margin: 0;
  padding: 0;
}
.cesium-performanceDisplay-defaultContainer {
  top: auto;
  bottom: 2px;
  right: 60px;
  /*width: 120px;*/
  /*display: none;*/
}
.cesium-performanceDisplay {
  background: transparent;
  border: none;
}
.cesium-performanceDisplay-ms {
  float: left;
  margin-right: 8px;
}
.cesium-performanceDisplay-fps {
  float: left;
}
.compass {
  top: 10px;
}
.navigation-controls {
  top: 100px;
}
.cssanimat {
  -webkit-transition: all 0.5s;
  transition: all 0.5s;
}
.unselected {
  -moz-user-select: none; /*火狐*/
  -webkit-user-select: none; /*webkit浏览器*/
  -ms-user-select: none; /*IE10*/
  -khtml-user-select: none; /*早期浏览器*/
  user-select: none;
}
/*自定义滚动条-------开始*/
::-webkit-scrollbar-track:horizontal {
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 6px rgba(255, 255, 255, 0);
  background-color: rgba(255, 255, 255, 0);
}
#distanceLegendDiv {
  display: none;
}
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0);
}

::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: #cbcbcb;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #aba0a0;
  cursor: pointer;
}
/*自定义滚动条-------结束*/
div {
  box-sizing: border-box;
}
.float_right {
  float: right;
}
.windycanvas_list {
  position: absolute;
  width: 360px;
  line-height: 34px;
  right: 20px;
  top: 20px;
  z-index: 100;
}
.windycanvas_row {
  position: relative;
  float: left;
  width: 100%;
  height: 34px;
  line-height: 34px;
  margin-bottom: 8px;
  color: #fff;
}
.windycanvas_row .name {
  float: left;
  width: 100px;
  height: 100%;
}
.windycanvas_row .slidercont {
  float: left;
  width: calc(100% - 100px);
  height: 100%;
}
.slidercont .sliderbaritem {
  margin: 15px 0px;
  width: 100%;
}
.sliderbaritem .layui-slider-input {
  border: none;
  background: transparent;
}
.sliderbaritem .layui-slider-input .layui-slider-input-txt input {
  background-color: transparent;
  color: #ffffff;
}
.layui-slider-input-btn {
  border: none;
}
.layui-slider-input-btn i:first-child {
  border: none;
}
.windycanvas_formcont {
  position: relative;
  color: #ffffff;
  width: 100%;
  margin-right: 12px;
  float: left;
}
.windycanvas_colorpanelbg {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 25px;
  bottom: 7px;
  right: 4px;
}
.windycanvas_span {
  float: left;
  margin-right: 64px;
  display: inline-block;
}
.windycanvas_formitem {
  box-sizing: border-box;
  display: block;
  float: left;
  width: 69%;
  height: 34px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #f5f5f5;
  background: rgba(30, 72, 125, 0.9);
  background-image: none;
  border: none;
  border-radius: 4px;
  outline: none;
  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
  -webkit-transition: border-color ease-in-out 0.15s,
    -webkit-box-shadow ease-in-out 0.15s;
  -o-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
  transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
}
.body_div {
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
