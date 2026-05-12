import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { getBoutiqueUpstream } from './proxy-target.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = getBoutiqueUpstream(env)
  const proxy = {
    '/api': { target, changeOrigin: true },
    '/static': { target, changeOrigin: true },
  }

  return {
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        'react-native': 'react-native-web',
      },
    },
    define: {
      global: 'window',
      __DEV__: JSON.stringify(false),
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
    build: {
      sourcemap: true,
    }
  }
})
