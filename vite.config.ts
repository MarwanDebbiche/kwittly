import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // The server runs in workerd (Cloudflare's runtime) in dev and in production.
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), tanstackStart(), react(), tailwindcss()],
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
})
