import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Resolve the library from source so edits hot-reload without rebuilding.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@versatilegurung/vue-nepali-datepicker/style.css': fileURLToPath(
        new URL('../packages/datepicker/src/styles/datepicker.css', import.meta.url),
      ),
      '@versatilegurung/vue-nepali-datepicker': fileURLToPath(
        new URL('../packages/datepicker/src/index.ts', import.meta.url),
      ),
    },
  },
})
