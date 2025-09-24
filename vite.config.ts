import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),   tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: "https://equally-credible-terrier.ngrok-free.app",
        changeOrigin: true, 
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Опционально: если нужно переписать путь (здесь оставляем /api)
      },
    },
  },
})
