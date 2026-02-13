import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const FUNCTIONS_BASE = 'https://us-central1-switchon-recipe-maker.cloudfunctions.net';

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
      '/api/ingredients/search': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingredients\/search/, '/search_ingredients'),
      },
      '/api/ingredients/update': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingredients\/update/, '/update_ingredient'),
      },
      '/api/ingredients': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingredients/, '/add_ingredient'),
      },
      '/api/ingredient-list/add': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingredient-list\/add/, '/add_to_ingredient_list'),
      },
      '/api/ingredient-list/remove': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingredient-list\/remove/, '/remove_from_ingredient_list'),
      },
      '/api/ingredient-list': {
        target: FUNCTIONS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingredient-list/, '/get_ingredient_list'),
      },
    },
  },
})
