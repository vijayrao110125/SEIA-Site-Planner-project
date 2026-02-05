import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    proxy: process.env.VITE_API_PROXY_TARGET
      ? { "/api": process.env.VITE_API_PROXY_TARGET }
      : undefined
  }
});
