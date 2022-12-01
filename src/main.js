import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "mapbox-gl/src/css/mapbox-gl.css";
import router from "./router/index";

const app = createApp(App);
app.use(router);
app.mount("#app");
