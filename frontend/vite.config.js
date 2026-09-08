import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Must match GitHub Pages repo sub-path
  base: '/mobile-store-pwa/',
})
