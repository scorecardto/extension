import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "./page/index.html"),
        worker: resolve(__dirname, "./src/worker.ts"),
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
