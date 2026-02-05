import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://theonebook-backend:3100', // 백엔드 주소
        changeOrigin: true,
      },
    },
  },
})
