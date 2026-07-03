import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split only the two big LEAF libraries into their own cacheable
        // chunks. Nothing depends back on the app code, so no circular chunks;
        // this also keeps every chunk under the size-warning threshold.
        manualChunks: {
          katex: ['katex'],
          highlight: ['highlight.js'],
        },
      },
    },
  },
})
