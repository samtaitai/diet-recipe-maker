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
      '/api/save_favorite': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/save_favorite/, '/save_favorite'),
      },
      '/api/get_favorites': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/get_favorites/, '/get_favorites'),
      },
      '/api/delete_favorite': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/delete_favorite/, '/delete_favorite'),
      },
    },
  },
})
