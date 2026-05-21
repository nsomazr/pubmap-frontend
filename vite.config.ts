import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3009,
    host: true,
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/storage": { target: "http://127.0.0.1:8099", changeOrigin: true },
    },
  },
  preview: {
    port: 3009,
    host: true,
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/storage": { target: "http://127.0.0.1:8099", changeOrigin: true },
    },
  },
});
