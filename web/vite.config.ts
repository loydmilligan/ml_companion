import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Talking Music League",
        short_name: "TML",
        description: "Family companion app for Music League",
        start_url: "/",
        display: "standalone",
        background_color: "#0a1a2f",
        theme_color: "#0a1a2f",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/favicon-1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any",
          },
        ],
        categories: ["entertainment", "music"],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      },
      devOptions: {
        enabled: false, // Disable in dev to avoid issues
      },
    }),
  ],
  define: {
    __FIREBASE_CONFIG__: JSON.stringify({
      apiKey: process.env.VITE_FIREBASE_API_KEY || "",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.VITE_FIREBASE_APP_ID || "",
    }),
  },
  server: {
    host: true,
    port: 5173,
    cors: true,
    allowedHosts: ["talking.mattmariani.com", "192.168.4.217"],
  },
});
