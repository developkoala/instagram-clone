import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
      '/rss': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/rss.xml': {
        target: 'http://127.0.0.1:8000/rss',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/rss.xml'
      },
      '/feed.xml': {
        target: 'http://127.0.0.1:8000/rss',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/feed.xml'
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
