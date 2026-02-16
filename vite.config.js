import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const FUNCTIONS_BASE = 'http://127.0.0.1:5001/switchon-recipe-maker/us-central1';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api/generateRecipe': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/generateRecipe/, '/generate_recipe'),
      },
      '/api/get_shopping_list': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/get_shopping_list/, '/get_shopping_list'),
      },
    },
  },
})
