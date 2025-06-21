import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@types': '/src/types',
      '@hooks': '/src/hooks',
      '@pages': '/src/pages',
      '@assets': '/src/assets'
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@stellar/stellar-sdk']
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
