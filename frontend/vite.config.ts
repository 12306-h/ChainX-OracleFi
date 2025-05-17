import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  return {
    plugins: [react(), cloudflare()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})