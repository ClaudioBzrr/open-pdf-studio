import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: [
        "favicon.svg",
        "robots.txt",
        "sitemap.xml",
        "llms.txt",
        "llms-full.txt",
        "og-image.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        id: "./",
        name: "OpenPDF Studio",
        short_name: "OpenPDF",
        description:
          "Private, open-source PDF workspace: read, annotate, edit, sign, OCR, redact, compress and protect PDFs locally in the browser.",
        lang: "en",
        dir: "ltr",
        start_url: "./app/",
        scope: "./",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        orientation: "any",
        background_color: "#FFFBF8",
        theme_color: "#0B6E4F",
        categories: ["productivity", "utilities", "business"],
        icons: [
          {
            src: "icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Open OpenPDF Studio",
            short_name: "Open app",
            description: "Open the local-first PDF workspace",
            url: "./app/",
            icons: [{ src: "icons/pwa-192.png", sizes: "192x192" }],
          },
          {
            name: "Open sample PDF",
            short_name: "Sample",
            description: "Try the app with a six-page sample document",
            url: "./app/?sample=1",
            icons: [{ src: "icons/pwa-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,mjs,css,html,svg,png,webp,woff2,pdf}"],
        globIgnores: ["vendor/tesseract/**", "tessdata/**"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.includes("/vendor/tesseract/") || url.pathname.includes("/tessdata/"),
            handler: "CacheFirst",
            options: {
              cacheName: "openpdf-ocr-assets",
              expiration: { maxEntries: 48, maxAgeSeconds: 31_536_000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
    watch: {
      ignored: ["**/desktop/vendor/**", "**/desktop/target/**", "**/desktop/dist/**"],
    },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL("./index.html", import.meta.url)),
        pt: fileURLToPath(new URL("./pt/index.html", import.meta.url)),
        app: fileURLToPath(new URL("./app/index.html", import.meta.url)),
      },
    },
  },
  worker: {
    format: "es",
  },
});
