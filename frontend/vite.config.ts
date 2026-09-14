import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // En développement, le front appelle /api comme en production : Vite relaie vers l'API sur le port 3001.
    // https://vite.dev/config/server-options
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
