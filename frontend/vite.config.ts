import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Application installable du personnel (§3, §7) : le service worker garde le code pour rouvrir les écrans sans réseau.
    // https://vite-pwa-org.netlify.app/guide/
    VitePWA({
      // Enregistré par les écrans du personnel seulement (hooks/useApplicationPersonnel.ts) : le téléphone d'un client
      // ne télécharge jamais toute l'application en arrière-plan (§8).
      injectRegister: false,
      // Nouvelle version appliquée quand le personnel touche « Mettre à jour » : jamais de rechargement en plein service.
      registerType: 'prompt',
      // Manifest écrit dans public/, lié par les écrans du personnel.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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
      // Socket.io : ws relaie aussi la connexion WebSocket, pas seulement les requêtes HTTP.
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
})
