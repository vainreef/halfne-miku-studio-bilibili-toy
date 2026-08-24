import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// 从 package.json 的 homepage 字段推导 GitHub Pages 子路径
const homepage = JSON.parse(readFileSync('package.json', 'utf-8')).homepage || '';
const base = homepage ? new URL(homepage).pathname.replace(/\/$/, '') + '/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    // Cohub sandbox 的预览域名经代理转发访问，需要显式允许，否则被 Vite 的 host 校验拦截
    allowedHosts: ['.cohub.live'],
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
