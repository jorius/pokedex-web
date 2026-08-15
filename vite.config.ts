import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `host: true` binds every interface (0.0.0.0) instead of loopback only, so the dev server
  // is reachable from other devices on the LAN — e.g. a phone at http://192.168.0.254:5173.
  // The port is pinned so that phone URL stays stable across restarts.
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
