import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0)
    port: 3000, // Changed from 5173 to 3000
  },
})
