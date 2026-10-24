import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({
  root, base:'/', plugins:[react()],
  publicDir:fileURLToPath(new URL('../public',import.meta.url)),
  server:{host:'127.0.0.1',port:3010,strictPort:true,fs:{allow:[fileURLToPath(new URL('..',import.meta.url))]}},
  build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{main:root+'index.html',expressions:root+'expressions.html',physics:root+'physics-compare.html'}}},
});
