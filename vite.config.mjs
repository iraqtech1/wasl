import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
export default defineConfig({
  root: "web",
  publicDir: "../public",
  plugins: [vue()],
  base: process.env.PAGES_BUILD === "1" ? "/wasl/" : "/",
  server: { host: "127.0.0.1", port: 5173 },
  build: {
    outDir: path.resolve(process.env.PAGES_BUILD === "1" ? "site" : "dist"),
    emptyOutDir: true,
  },
});
