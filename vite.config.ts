import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['playwright', 'patchright', 'patchright-core', 'xlsx', 'electron-updater', 'electron'],
            },
          },
        },
      },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
})
