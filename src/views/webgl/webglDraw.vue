<template>
  <!-- <ScreenAdapter> -->
  <!-- <div class="h10vh header flex">某某数据大屏展示平台</div> -->
  <div class="flex center">
    <div class="map" id="map"></div>
    <TimelinePlay :style="commonStyle" />
    <!-- <div class="windycanvas">
        <canvas
          id="windycanvas"
          :width="canvasWidth"
          :height="canvasHeight"
        ></canvas>
      </div> -->
    <!-- <div class="echartDemo flex1 flex">
          <div class="top width100" id="left-bar"></div>
          <div class="side-center width100" id="left-radar"></div>
          <div class="bottom width100">滚动列表</div>
        </div> -->
    <!-- <div class="textDemo flex1 flex">
          <div class="side-center width100" id="right-radar"></div>
          <div class="bottom width100" id="right-bar"></div>
        </div> -->
  </div>
  <!-- <div class="h10vh footer">
        此处是角标，可以观察在不同得分辨率下字体大小的自适应情况
      </div> -->
  <!-- </ScreenAdapter> -->
</template>

<script>
import { Map, Marker, Popup, MercatorCoordinate } from "mapbox-gl";
// import * as echarts from "echarts";
import ScreenAdapter from "../../components/ScreenAdapter.vue";
import { CanvasWindy } from "../../utils/Windy";
import * as windGl from "../../utils/wind-gl.js";
import TimelinePlay from "../../components/TimelinePlay.vue";
let animTime = 0;
let buffers = [],
  activeBuffer = null;

//全局变量
let pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
const windFiles = {
  0: "2016112000",
  6: "2016112006",
  12: "2016112012",
  18: "2016112018",
  24: "2016112100",
  30: "2016112106",
  36: "2016112112",
  42: "2016112118",
  48: "2016112200",
};
const meta = {
  "2016-11-20+h": 0,
  "retina resolution": true,
  "github.com/mapbox/webgl-wind": function () {
    window.location = "https://github.com/mapbox/webgl-wind";
  },
};

var wind = null;
var ratio = null;
var tmpmatrix = null;
export default {
  name: "Index",
  components: { ScreenAdapter, TimelinePlay },
  data() {
    return {
      map: null,
      echartsLeftBar: null,
      echartsRightBar: null,
      radarLeft: null,
      radarRight: null,
      canvasWidth: 0,
      canvasHeight: 0,
      program: null,
      aPos: null,
      unifromAnim: null,
      buffer: null,
      //新的

      // inColor:null,
      // pointH:null,
      commonStyle: {
        position: "absolute",
        bottom: 0,
      },
    };
  },
  mounted() {
    this.initMap();
    // this.echartsLeftBar = echarts.init(document.getElementById("left-bar"));
    // this.initEchart(this.echartsLeftBar);
    // this.echartsRightBar = echarts.init(document.getElementById("right-bar"));
    // this.initEchart(this.echartsRightBar);
    // this.radarLeft = echarts.init(document.getElementById("left-radar"));
    // this.initRadar(this.radarLeft);
    // this.radarRight = echarts.init(document.getElementById("right-radar"));
    // this.initRadar(this.radarRight);

    window.onresize = () => {
      // this.echartsLeftBar.resize();
      // this.echartsRightBar.resize();
      // this.radarLeft.resize();
      // this.radarRight.resize();
    };
  },
  methods: {
    initRadar(instance) {
      instance.setOption({
        title: {
          text: "雷达图",
          top: 10,
          left: 10,
        },
        tooltip: {
          trigger: "item",
        },
        legend: {
          type: "scroll",
          bottom: 10,
          data: (function () {
            var list = [];
            for (var i = 1; i <= 28; i++) {
              list.push(i + 2000 + "");
            }
            return list;
          })(),
        },
        visualMap: {
          top: "middle",
          right: 10,
          color: ["red", "yellow"],
          calculable: true,
        },
        radar: {
          indicator: [
            { text: "IE8-", max: 400 },
            { text: "IE9+", max: 400 },
            { text: "Safari", max: 400 },
            { text: "Firefox", max: 400 },
            { text: "Chrome", max: 400 },
          ],
        },
        series: (function () {
          var series = [];
          for (var i = 1; i <= 28; i++) {
            series.push({
              type: "radar",
              symbol: "none",
              lineStyle: {
                width: 1,
              },
              emphasis: {
                areaStyle: {
                  color: "rgba(0,250,0,0.3)",
                },
              },
              data: [
                {
                  value: [
                    (40 - i) * 10,
                    (38 - i) * 4 + 60,
                    i * 5 + 10,
                    i * 9,
                    (i * i) / 2,
                  ],
                  name: i + 2000 + "",
                },
              ],
            });
          }
          return series;
        })(),
      });
    },
    initMap() {
      const monument = [7.5, 58];
      this.map = new Map({
        container: "map", // container id 绑定的组件的id
        // style: "mapbox://styles/mapbox/streets-v11", //地图样式，可以使用官网预定义的样式,也可以自定义
        // center: monument, // 初始坐标
        // zoom: 15, // starting zoom 地图初始的拉伸比例
        pitch: 0, //地图的角度，不写默认是0，取值是0-60度，一般在3D中使用
        // bearing: 0, //地图的初始方向，值是北的逆时针度数，默认是0，即是正北
        // antialias: true, //抗锯齿，通过false关闭提升性能
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
        .addTo(this.map);
      //绘制小三角
      // this.addT();
      //绘制风力数据
      // this.addWind();
      this.addWebglWind();
    },
    initEchart(instance) {
      instance.setOption({
        title: {
          text: "南丁格尔玫瑰图",
          //   subtext: "Fake Data",
          left: "center",
          top: "4%",
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)",
        },
        legend: {
          left: "center",
          top: "bottom",
          data: [
            "rose1",
            "rose2",
            "rose3",
            "rose4",
            "rose5",
            "rose6",
            "rose7",
            "rose8",
          ],
        },
        toolbox: {
          show: true,
          feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true },
          },
        },
        series: [
          {
            name: "Area Mode",
            type: "pie",
            radius: ["10%", "60%"],
            center: ["50%", "60%"],
            roseType: "area",
            itemStyle: {
              borderRadius: 5,
            },
            data: [
              { value: 30, name: "rose 1" },
              { value: 28, name: "rose 2" },
              { value: 26, name: "rose 3" },
              { value: 24, name: "rose 4" },
              { value: 22, name: "rose 5" },
              { value: 20, name: "rose 6" },
              { value: 18, name: "rose 7" },
              { value: 16, name: "rose 8" },
            ],
          },
        ],
      });
    },
    //绘制风力可视化数据
    drawWind() {
      windycanvas = document.getElementById("windycanvas");
      this.canvasWidth = window.innerWidth;
      this.canvasHeight = window.innerHeight;
      console.log(window.innerWidth, window.innerHeight, "请求");
      fetch("/data/windydata.json", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((data) => {
          const params = {
            // extent:[73.6666,135.0416,3.86666,53.55],//中国范围
            canvas: windycanvas,
            canvasWidth: window.innerWidth,
            canvasHeight: window.innerHeight,
            speedRate: 0.15,
            particlesNumber: 60000,
            maxAge: 120,
            frameRate: 10,
            color: "#e0761a",
            lineWidth: 2,
          };
          windy = new CanvasWindy(data, params);
        })
        .catch((err) => {
          console.log(err, "获取数据失败");
        });
    },
    addT() {
      let self = this;
      var highlightLayer = {
        id: "highlight",
        type: "custom",
        onAdd: function (map, gl) {
          var vertexSource = `
                  uniform mat4 u_matrix;
                  uniform float  anim;
                  attribute vec2 a_pos;
                  void main() {
                      gl_Position = u_matrix * vec4(a_pos,anim , 1.0);
                  }
                  `;
          var fragmentSource = `
                  void main() {
                      gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
                  }
                  `;
          var vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader, vertexSource);
          gl.compileShader(vertexShader);
          var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader, fragmentSource);
          gl.compileShader(fragmentShader);
          this.program = gl.createProgram();
          gl.attachShader(this.program, vertexShader);
          gl.attachShader(this.program, fragmentShader);
          gl.linkProgram(this.program);
          this.aPos = gl.getAttribLocation(this.program, "a_pos");
          this.unifromAnim = gl.getUniformLocation(this.program, "anim");
          var helsinki = MercatorCoordinate.fromLngLat({
            lng: -80.0,
            lat: 45,
          });
          var berlin = MercatorCoordinate.fromLngLat({
            lng: 0,
            lat: 0,
          });
          var kyiv = MercatorCoordinate.fromLngLat({
            lng: -80.0,
            lat: -45,
          });

          this.buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
              helsinki.x,
              helsinki.y,
              berlin.x,
              berlin.y,
              kyiv.x,
              kyiv.y,
            ]),
            gl.STATIC_DRAW
          );
        },
        render: function (gl, matrix) {
          gl.useProgram(this.program);
          gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, "u_matrix"),
            false,
            matrix
          );
          animTime += 0.0002;
          animTime = animTime % 0.1;
          gl.uniform1f(this.unifromAnim, animTime);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          gl.enableVertexAttribArray(this.aPos);
          gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
          self.map.triggerRepaint();
          return true;
        },
      };

      this.map.on("load", function () {
        self.map.addLayer(highlightLayer, "building");
      });
    },
    addWind() {
      let self = this;
      this.map.on("load", () => {
        self.addHitLayer();
      });
    },
    getElementIndex() {
      var arr = [];
      for (var i = 0; i < 150; i++) {
        for (var j = 0; j < 360; j++) {
          var x = j + 361 * i;
          var y = x + 1;
          var z = x + 361;
          var arr1 = [x, y, z, y, z, ++z];
          arr.push(...arr1);
        }
      }
      return arr;
    },
    addHitLayer() {
      let self = this;
      fetch("/data/windres.json", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((res) => {
          let resultAll = res.data;
          let result0 = res.data[0];
          let pointLen = result0.length / 7;
          // let indexEle = self.getElementIndex();
          var customLayer = {
            id: "windpoint",
            type: "custom",
            onAdd: function (map, gl) {
              var vertexSource = `
                           uniform mat4 u_matrix;
                           attribute vec2 a_pos;
                           attribute   vec4  inColor;
                           varying     vec4  outColor;
                           attribute float  pointH;
                            void main() {
                                outColor      =   inColor;
                                gl_Position =    u_matrix * vec4(a_pos,pointH , 1.0);
                           }
                          `;
              var fragmentSource = `
                          precision   lowp  float;
                          varying     vec4  outColor;
                          void main() {
                          gl_FragColor = outColor;
                            //  gl_FragColor =   vec4(1.0, 0.0, 0.0, 0.5);
                          }
                          `;
              var vertexShader = gl.createShader(gl.VERTEX_SHADER);
              gl.shaderSource(vertexShader, vertexSource);
              gl.compileShader(vertexShader);
              var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
              gl.shaderSource(fragmentShader, fragmentSource);
              gl.compileShader(fragmentShader);
              this.program = gl.createProgram();
              gl.attachShader(this.program, vertexShader);
              gl.attachShader(this.program, fragmentShader);
              gl.linkProgram(this.program);

              this.aPos = gl.getAttribLocation(this.program, "a_pos");
              this.inColor = gl.getAttribLocation(this.program, "inColor");
              this.pointH = gl.getAttribLocation(this.program, "pointH");

              for (let i = 0; i < resultAll.length; i++) {
                this["buffer" + i] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this["buffer" + i]);
                gl.bufferData(
                  gl.ARRAY_BUFFER,
                  new Float32Array(resultAll[i]),
                  gl.STATIC_DRAW
                );
                buffers.push(this["buffer" + i]);
              }

              activeBuffer = buffers[0];
              this.indexBuffer = gl.createBuffer();
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
              gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(indexEle),
                gl.STATIC_DRAW
              );
            },

            render: function (gl, matrix) {
              gl.useProgram(this.program);
              gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, "u_matrix"),
                false,
                matrix
              );
              gl.bindBuffer(gl.ARRAY_BUFFER, activeBuffer);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
              gl.enableVertexAttribArray(this.aPos);
              gl.enableVertexAttribArray(this.inColor);
              gl.enableVertexAttribArray(this.pointH);
              gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 4 * 7, 0);
              gl.vertexAttribPointer(
                this.inColor,
                4,
                gl.FLOAT,
                false,
                4 * 7,
                4 * 2
              );
              gl.vertexAttribPointer(
                this.pointH,
                1,
                gl.FLOAT,
                false,
                4 * 7,
                4 * 6
              );
              // 颜色混合
              gl.enable(gl.BLEND);
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
              //
              gl.drawArrays(gl.LINE_STRIP, 0, pointLen);
              // gl.drawElements(
              //   gl.TRIANGLES,
              //   indexEle.length,
              //   gl.UNSIGNED_SHORT,
              //   0
              // );
              self.map.triggerRepaint();
              return true;
            },
          };

          this.map.addLayer(customLayer);
          let i = 0;
          setInterval(() => {
            if (i > buffers.length - 1) {
              i = 0;
            }
            if (buffers[i]) {
              activeBuffer = buffers[i];
            }
            i++;
          }, 200);
        })
        .catch((err) => {
          console.log(err, "获取数据失败");
        });
    },
    addWebglWind() {
      let self = this;

      const windLayer = {
        id: "wind",
        type: "custom",
        onAdd: function (map, gl) {
          wind = new WindGL(gl);
          wind.numParticles = 65536;
          self.updateWind(0);
        },
        render: function (gl, matrix) {
          tmpmatrix = matrix;
          if (wind.windData) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            wind.draw(matrix);
            self.map.triggerRepaint();
            return true;
          }
        },
      };
      this.map.on("load", function () {
        self.map.addLayer(windLayer);
      });
      var popup = null;
      this.map.on("mousemove", function (e) {
        // console.log(wind);
        let coordinate = {
          x: e.lngLat.lng,
          y: e.lngLat.lat,
        };
        let windSpeed = null;
        if (wind) {
          windSpeed = wind.getSpeed(coordinate);
          if (windSpeed) {
          }
          if (popup) {
            popup.remove();
            popup = null;
          }
          // popup = new mapboxgl.Popup({ closeOnClick: false })
          //     .setLngLat([coordinate.x, coordinate.y])
          //     .setHTML(`<div>水平风速：${windSpeed[0]}m/s</div><div>垂直风速：${windSpeed[1]}m/s</div>`)
          //     .addTo(map);
        }
      });
      this.map.on("wheel", function () {
        if (wind) wind.resize();
      });
      this.map.on("dragstart", function () {
        if (wind) wind.resize();
      });
      this.map.on("move", function () {
        if (wind) wind.resize();
      });
    },
    updateWind(name) {
      let self = this;
      // return new Promise((resolve, reject) => {
      this.getJSON("/data/" + windFiles[name] + ".json", function (windData) {
        const windImage = new Image();
        windData.image = windImage;
        windImage.src = "/data/" + windFiles[name] + ".png";
        windImage.onload = function () {
          wind.setWind(windData);
          setTimeout(() => {
            self.map.setPitch(self.map.getPitch());
          }, 0);

          console.log("3333366666666666", wind.windData, self.flag);
          // resolve();
        };
        // });
      });
    },
    getJSON(url, callback) {
      const xhr = new XMLHttpRequest();
      xhr.responseType = "json";
      xhr.open("get", url, true);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          callback(xhr.response);
        } else {
          throw new Error(xhr.statusText);
        }
      };
      xhr.send();
    },
  },
};
</script>
<style lang="scss" scoped>
.map {
  flex: 1;
  background-color: rgba(49, 9, 115, 0.241);
  order: 2;
  height: 100%;
}
.echartDemo {
  order: 1;
  background-color: rgba(250, 235, 215, 0.201);
  height: 100%;
  flex-direction: column;
}
.center {
  height: 100%;
  position: relative;
}
.textDemo {
  order: 3;
  background-color: rgba(27, 33, 204, 0.09);
  height: 100%;
  flex-direction: column;
}
.header {
  background-color: rgba(1, 1, 48, 0.64);
  font-size: 60px;
  justify-content: center;
  color: aliceblue;
}
.footer {
  background-color: rgba(11, 1, 4, 0.308);
  font-size: 30px;
  line-height: 15vh;
  color: #fff;
  border: 5px solid red;
  box-sizing: border-box;
}
.side-center {
  flex: 0 1 50%;
}
.top {
  flex: 1;
  background-color: #fff;
}
.bottom {
  flex: 1;
  background-color: rgba(255, 255, 0, 0.073);
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
.windycanvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
#windycanvas {
  position: absolute;
  display: block;
  border: none;
  box-sizing: border-box;
}
</style>
