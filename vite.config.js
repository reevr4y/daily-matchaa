import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/daily-life-tracker/',
  
  esbuild: {
    drop: ['console', 'debugger']
  },

  build: {
    // ✅ Code splitting for faster initial load
    rollupOptions: {
      output: {
        // Simplified manual chunks
      }
    },
    
    // ✅ Build-time optimizations
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  
  // ✅ Dev server optimization
  server: {
    hmr: {
      overlay: false // Disable overlay for smoother dev experience
    }
  }
})
