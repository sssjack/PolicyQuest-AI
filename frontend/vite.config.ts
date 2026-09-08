import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/PolicyQuest/',
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  },
  build: {
    // 保留旧版 Chromium 可识别的媒体查询，避免构建后响应式布局失效。
    cssTarget: 'chrome90',
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
