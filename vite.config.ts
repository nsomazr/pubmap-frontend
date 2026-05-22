import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("leaflet")) return "leaflet";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@tanstack")) return "query";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            /\/react\//.test(id)
          ) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 3099,
    host: true,
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/storage": { target: "http://127.0.0.1:8099", changeOrigin: true },
    },
  },
  preview: {
    port: 3099,
    host: true,
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8099", changeOrigin: true },
      "/storage": { target: "http://127.0.0.1:8099", changeOrigin: true },
    },
  },
});
