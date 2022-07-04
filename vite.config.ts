import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const { resolve } = require("path");

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "./page/index.html"),
        background: resolve(__dirname, "./src/background.ts"),
      },
      output: {
        entryFileNames: "src/[name].js",
        chunkFileNames: "src/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  plugins: [react()],
});
