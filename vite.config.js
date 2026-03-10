import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // ✅ Important: kung i-deploy sa root ng domain
  build: {
    outDir: 'dist', // ✅ Default sa Vite, pero siguraduhin
  },
  server: {
    port: 5173, // optional: para sa local dev
  },
})