import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Guarantee every VITE_* placeholder referenced in index.html (and any
  // import.meta.env.VITE_* read by the app) resolves to a defined value, so
  // builds stay warning-free and runtime code never sees undefined, even when
  // no client/.env file exists. Real values from client/.env still win.
  const env = loadEnv(mode, process.cwd(), '')
  const define = {}
  for (const key of [
    'VITE_API_URL',
    'VITE_GA4_MEASUREMENT_ID',
    'VITE_GOOGLE_SITE_VERIFICATION',
  ]) {
    if (!Object.hasOwn(env, key) || env[key] === undefined) {
      define[`import.meta.env.${key}`] = JSON.stringify('')
    }
  }

  return {
  plugins: [
    react(),
    tailwindcss(),
  ],
  define,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'vendor-charts'
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) {
            return 'vendor-mui'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/zustand/') ||
            id.includes('node_modules/axios/') ||
            id.includes('node_modules/socket.io-client/')
          ) {
            return 'vendor-core'
          }
          if (id.includes('node_modules')) return 'vendor'
          return undefined
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ['.e2b.app'],
  },
  }
})
