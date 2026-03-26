import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /// <reference types="vite/client" />

// interface ImportMetaEnv {
//   readonly VITE_SERVER_URL: string
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv
// }

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    proxy: {
      // Only proxy the REST API — Socket.io connects directly to :3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
