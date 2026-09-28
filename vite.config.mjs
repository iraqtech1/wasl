import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
const apiTarget = process.env.WASEL_API_URL || "http://127.0.0.1:4173";
export default defineConfig({
  root: "web",
  publicDir: "../public",
  plugins: [vue()],
  base: process.env.PAGES_BUILD === "1" ? "/wasl/" : "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (request) =>
            request.setHeader("origin", apiTarget),
          );
        },
      },
    },
  },
  build: {
    outDir: path.resolve(process.env.PAGES_BUILD === "1" ? "site" : "dist"),
    emptyOutDir: true,
  },
});
