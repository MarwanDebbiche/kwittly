import { cloudflare } from '@cloudflare/vite-plugin'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // The server runs in workerd (Cloudflare's runtime) in dev and in production.
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    react(),
    // Lingui: compiles the t`...`/<Trans> macros and the .po catalogs; the build
    // fails if a French translation is missing.
    lingui({ failOnMissing: true }),
    babel({ presets: [linguiTransformerBabelPreset()] }),
    tailwindcss(),
  ],
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
})
