import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Define a base URL para o GitHub Pages (subdiretório do repositório)
  base: '/psinote/',
  plugins: [react()],
  // Opcional: configure o servidor de desenvolvimento se precisar
  server: {
    port: 3000,
    open: true
  },
  // Configuração de build (opcional, mas pode ser útil)
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa bibliotecas grandes em chunks separados
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react', 'react-toastify', 'recharts']
        }
      }
    }
  }
})
