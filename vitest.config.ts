/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['deggen.ngrok.app']
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
})