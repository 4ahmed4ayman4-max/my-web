import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [],
  server: {
    port: 5173,
    host: "localhost",
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      "@api": path.resolve("./src/api"),
      "@features": path.resolve("./src/features"),
      "@shared": path.resolve("./src/shared"),
      "@app": path.resolve("./src/app"),
    },
  },
});