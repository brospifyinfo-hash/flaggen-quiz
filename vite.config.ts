/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { GET as kontoGet, POST as kontoPost } from './api/konto'

/**
 * In der Entwicklung und in der Vorschau beantwortet dieselbe Funktion wie auf Vercel
 * die Konto-Anfragen – die Daten landen im Ordner .konto-daten.
 */
function kontoApi(): Plugin {
  const bedienen = async (req: IncomingMessage, res: ServerResponse) => {
    const stuecke: Buffer[] = []
    for await (const stueck of req) stuecke.push(stueck as Buffer)
    const body = Buffer.concat(stuecke)
    const kopf = new Headers()
    for (const [name, wert] of Object.entries(req.headers)) {
      if (typeof wert === 'string') kopf.set(name, wert)
      else if (Array.isArray(wert)) kopf.set(name, wert.join(', '))
    }
    const anfrage = new Request(`http://lokal${req.url ?? '/api/konto'}`, {
      method: req.method ?? 'GET',
      headers: kopf,
      body: body.length > 0 ? body : undefined,
    })
    const antwort = req.method === 'POST' ? await kontoPost(anfrage) : await kontoGet()
    res.statusCode = antwort.status
    antwort.headers.forEach((wert, name) => res.setHeader(name, wert))
    res.end(Buffer.from(await antwort.arrayBuffer()))
  }
  return {
    name: 'konto-api',
    configureServer(server) {
      server.middlewares.use('/api/konto', (req, res) => void bedienen(req, res))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/konto', (req, res) => void bedienen(req, res))
    },
  }
}

export default defineConfig({
  plugins: [
    kontoApi(),
    react(),
    VitePWA({
      // Neue Versionen übernehmen sofort; die offene Seite läuft ungestört weiter,
      // der nächste Start lädt die neue Version (Registrierung in src/pwa.ts, ohne Auto-Reload)
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Weltwissen – Quiz',
        short_name: 'Weltwissen',
        description: 'Quiz mit mehreren Kategorien: Flaggen, Einwohnerzahlen und mehr. Funktioniert auch offline.',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2f4f8',
        theme_color: '#f2f4f8',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles – inklusive aller Flaggen – landet beim ersten Besuch im Offline-Speicher
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
})
