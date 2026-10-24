import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// 从 package.json 的 homepage 字段推导 GitHub Pages 子路径
const metadata = JSON.parse(readFileSync('package.json', 'utf-8'));
const homepage = metadata.homepage || '';
const releaseID=process.env.HALFNE_RELEASE_ID || metadata.version;
const base = homepage ? new URL(homepage).pathname.replace(/\/$/, '') + '/' : '/';

export default defineConfig(({mode})=>({
  base:mode==='toy'?'./':base,
  plugins: [react(),{name:'release-version',transformIndexHtml(html){return html.replace('<head>',`<head>\n<meta name="halfne-version" content="${releaseID}">`)},generateBundle(){this.emitFile({type:'asset',fileName:'release.json',source:JSON.stringify({version:metadata.version,releaseID,variant:mode==='toy'?'toy':'web',mobileRenderer:'webgl-unified-hd-v2',resolutionPolicy:'native-screen-hd-tiles',animationRuntime:'compiled-v2',fpsSource:'render-commit'})})}},...(mode==='toy'?[{name:'toy-sdk-entry',transformIndexHtml(html){return html.replace('<html lang="zh-CN">','<html lang="zh-CN" data-toy-build="1">').replace('<head>','<head>\n<script async src="https://s1.hdslb.com/bfs/seed/toy/app/sdk/toy-sdk.js"></script>')}}]:[])],
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
    outDir: mode==='toy'?'build-toy':'build',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
}));
