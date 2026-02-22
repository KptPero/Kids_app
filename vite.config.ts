import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Kids_app/',
  plugins: [react()],
  server: { port: 5173 }
})
