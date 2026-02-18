import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          faker: ['@faker-js/faker'],
          xlsx: ['xlsx'],
          yaml: ['js-yaml'],
          diff: ['diff'],
          radix: [
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
          ],
        },
      },
    },
  },
})
