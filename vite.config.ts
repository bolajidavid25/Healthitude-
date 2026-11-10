import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import path from "node:path"

export default defineConfig({
  plugins: [
    react(),

    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },

    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },

  server: {
    host: "0.0.0.0",

    port: 5173,

    strictPort: true,

    proxy: {
      "/api": {
        target: "http://localhost:5000",

        changeOrigin: true,

        secure: false,
      },
    },
  },

  preview: {
    host: "0.0.0.0",

    port: 5173,

    proxy: {
      "/api": {
        target: "http://localhost:5000",

        changeOrigin: true,

        secure: false,
      },
    },
  },
})
