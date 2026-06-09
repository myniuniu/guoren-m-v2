import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const aiProxyTarget = env.VITE_AI_API_BASE_URL || 'https://test-guoren-ai.grtcloud.net'

  return {
    server: {
      host: '0.0.0.0',
      proxy: {
        '/__ai_proxy': {
          target: aiProxyTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (requestPath) => requestPath.replace(/^\/__ai_proxy/, ''),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('react-router')) {
              return 'vendor-router'
            }

            if (
              id.includes('react-markdown')
              || id.includes('remark-gfm')
              || id.includes('micromark')
              || id.includes('mdast')
              || id.includes('hast')
              || id.includes('unified')
              || id.includes('unist')
            ) {
              return 'vendor-markdown'
            }

            if (
              id.includes('/react/')
              || id.includes('/react-dom/')
              || id.includes('/scheduler/')
            ) {
              return 'vendor-react'
            }

            return 'vendor'
          },
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: '果仁',
          short_name: '果仁',
          description: '果仁 - 移动端应用',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
  }
})
