import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api/generateRecipe': {
        target: 'https://generate-recipe-hsmvl7h2ia-uc.a.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/generateRecipe/, ''),
      },
    },
  },
})
