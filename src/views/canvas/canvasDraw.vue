<template>
  <div class="flex center">
    <canvas
      id="windycanvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>
    <div class="map" id="map"></div>
  </div>
</template>

<script setup>
import { Map, Marker, Popup, MercatorCoordinate } from "mapbox-gl";
import { ref, onMounted } from "vue";
import { CanvasWindy } from "../../utils/Windy";
const windy = ref(null);
const map = ref(null);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const initMap = () => {
  const monument = [7.5, 58];
  map.value = new Map({
    container: "map",
    pitch: 0,
    zoom: 0,
    center: monument,
    style: "mapbox://styles/mapbox/dark-v10",
    renderWorldCopies: false,
    antialias: true,
    accessToken:
      "pk.eyJ1IjoieDFuZzFpIiwiYSI6ImNrcG04OGduMzFlbGYydWxyYWhxdjBqMWoifQ.IwxoDAjWn64xlNNSgrp3ow",
  });
  const popup = new Popup({ offset: 25 }).setText("点我啊点我啊");
  const el = document.createElement("div");
  el.id = "marker-me";
  el.className += "marker-me";
  el.style.width = "50px";
  el.style.height = "50px";
  el.style.backgroundImage = `url("https://docs.mapbox.com/mapbox-gl-js/assets/washington-monument.jpg")`;
  el.style.backgroundSize = "cover";
  el.style.borderRadius = "50%";
  el.style.cursor = "pointer";
  new Marker(el)
    .setLngLat(monument)
    .setPopup(popup) // sets a popup on this marker
    .addTo(map.value);
  drawWind();
};
const drawWind = () => {
  const windycanvas = document.getElementById("windycanvas");
  canvasWidth.value = window.innerWidth;
  canvasHeight.value = window.innerHeight;
  //_ne:东北
  //_sw:西南
  const bounds = map.value.getBounds();

  const west = bounds._sw.lng; //西
  const east = bounds._ne.lng; //东
  const south = bounds._sw.lat; //南
  const north = bounds._ne.lat; //北
  console.log(west, east, south, north, "获取当前地图范围");
  fetch("/data/windydata.json", {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      const params = {
        extent: [west, east, south, north], //范围
        canvas: windycanvas,
        canvasWidth: window.innerWidth,
        canvasHeight: window.innerHeight,
        speedRate: 0.15,
        particlesNumber: 2000,
        maxAge: 120,
        frameRate: 10,
        color: "#e0761a",
        lineWidth: 2,
      };
      windy.value = new CanvasWindy(data, params);
      addCanvasSource(west, east, south, north);
    })
    .catch((err) => {
      console.log(err, "获取数据失败");
    });
};
const addCanvasSource = (west, east, south, north) => {
  //西北坐标开始
  map.value.addSource("canvas-source", {
    type: "canvas",
    canvas: "windycanvas",
    coordinates: [
      [west, north],
      [east, north],
      [east, south],
      [west, south],
    ],
    // Set to true if the canvas source is animated. If the canvas is static, animate should be set to false to improve performance.
    animate: true,
  });

  map.value.addLayer({
    id: "canvas-layer",
    type: "raster",
    source: "canvas-source",
  });
  map.value.on("moveend", function (e) {
    const bounds = map.value.getBounds();
    const west = bounds._sw.lng; //西
    const east = bounds._ne.lng; //东
    const south = bounds._sw.lat; //南
    const north = bounds._ne.lat; //北
    //鼠标移动。重新绘制
    console.log("触发重新绘制---------新的范围", [west, east, south, north]);
    windy.value.redraw([west, east, south, north]);
  });
};
onMounted(() => {
  initMap();
});
</script>
<style lang="scss" scoped>
.map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
}

.center {
  height: 100%;
  position: relative;
}

//map

.mapboxgl-marker.marker-me {
  // background-image: url("https://docs.mapbox.com/mapbox-gl-js/assets/washington-monument.jpg");
  // background-size: cover;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  background-color: red;
}

.mapboxgl-popup {
  max-width: 200px;
}

//风力canvas
</style>
