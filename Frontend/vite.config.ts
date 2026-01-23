import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        // localhost 대신 127.0.0.1로 변경하여 통신 안정성 확보
        target: 'http://127.0.0.1:8080', 
        changeOrigin: true,
        secure: false,
        // 만약 백엔드 컨트롤러(@RequestMapping)에 "/api"가 포함되어 있지 않다면 
        // 아래 rewrite 주석을 해제해야 합니다.
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})