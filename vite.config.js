import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // In dev, run `PORT=3100 npm start` alongside `npm run dev` to use the content API.
    proxy: {
      '/api': { target: `http://localhost:${process.env.API_PORT || 3100}`, changeOrigin: true },
      '/uploads': { target: `http://localhost:${process.env.API_PORT || 3100}`, changeOrigin: true },
    },
  },
  plugins: [react()],
})
