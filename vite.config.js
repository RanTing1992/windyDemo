import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import requireTransform from "vite-plugin-require-transform";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import cesium from "vite-plugin-cesium";
export default defineConfig({
  plugins: [
    vue(),
    cesium(),
    requireTransform({
      // fileRegex: /.ts$|.tsx$|.vue$/,
      fileRegex: /.js$|.jsx$|.vue$/,
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
});
