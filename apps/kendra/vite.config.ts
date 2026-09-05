import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'prod-verified-1.preview.emergentagent.com',
      'prod-verified-1.cluster-9.preview.emergentcf.cloud',
    ],
    proxy: {
      '/api': 'http://localhost:8002',
    },
  },
})
