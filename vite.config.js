import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './ssl/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, './ssl/server.crt')),
    },
    port: 5173, // port par défaut de Vite
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
