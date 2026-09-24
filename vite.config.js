import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  base: '',
  plugins: [
    vue(),
    vueDevTools(),
    ui({
      components: {
        dirs: [],
      },
      ui: {
        colors: {
          primary: 'blue',
          neutral: 'zinc',
        },
        pageHeader: {
          slots: {
            root: 'border-none',
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
