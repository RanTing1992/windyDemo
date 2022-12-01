import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/index",
    },
    {
      path: "/index",
      name: "index",
      component: () => import("../views/index.vue"),
    },
    {
      path: "/canvas",
      name: "canvasDraw",
      component: () => import("../views/canvas/canvasDraw.vue"),
    },
    {
      path: "/webgl",
      name: "webglDraw",
      component: () => import("../views/webgl/webglDraw.vue"),
    },
    {
      path: "/echart",
      name: "echartDraw",
      component: () => import("../views/echart/echartDraw.vue"),
    },
    {
      path: "/cesium",
      name: "cesiumDraw",
      component: () => import("../views/cesium/cesiumDraw.vue"),
    },
  ],
});

export default router;
