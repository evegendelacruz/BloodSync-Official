import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['pg'], // keep native pg driver external
    },
  },
})
