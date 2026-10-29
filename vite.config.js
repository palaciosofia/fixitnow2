import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        // Librerías en archivos aparte: cambian poco, así el navegador las
        // reutiliza de caché entre despliegues.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@firebase/storage') || id.includes('firebase/storage')) return 'firebase-storage'
          if (id.includes('firebase')) return 'firebase'
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
        },
      },
    },
  },
})
