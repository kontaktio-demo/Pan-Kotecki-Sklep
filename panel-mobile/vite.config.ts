import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectManifest: {
        // aplikacja online (panel) — nie precache'ujemy, SW służy do powiadomień push
        injectionPoint: undefined,
      },
      manifest: {
        name: "Pan Kotecki — Panel",
        short_name: "Pan Kotecki",
        description: "Panel zarządzania sklepem Pan Kotecki",
        lang: "pl",
        dir: "ltr",
        theme_color: "#ef7a30",
        background_color: "#f7f4ee",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
