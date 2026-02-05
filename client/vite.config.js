import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: (() => {
    const proxyTarget = process.env.VITE_API_PROXY_TARGET;
    if (!proxyTarget && process.env.NODE_ENV !== "production") {
      throw new Error("Missing VITE_API_PROXY_TARGET for dev proxy");
    }
    return {
      port: 8000,
      proxy: proxyTarget ? { "/api": proxyTarget } : undefined
    };
  })()
});
