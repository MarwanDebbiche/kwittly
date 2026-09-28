import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts: tests need none of the app plugins (Cloudflare, TanStack Start, Lingui).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'convex/lib/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          // Convex functions against an in-memory backend (convex-test).
          name: 'convex',
          include: ['convex/*.test.ts'],
          environment: 'edge-runtime',
          server: { deps: { inline: ['convex-test'] } },
        },
      },
    ],
  },
})
