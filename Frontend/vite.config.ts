import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL || 'http://i14d205.p.ssafy.io:8102';

  return {
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
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          // 만약 백엔드 컨트롤러(@RequestMapping)에 "/api"가 포함되어 있지 않다면 
          // 아래 rewrite 주석을 해제해야 합니다.
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
