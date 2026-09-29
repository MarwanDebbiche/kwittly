import { createFileRoute } from '@tanstack/react-router'

// Served by the app rather than from public/: the installed app starts on the
// page it was added from. On iOS, a home screen app does not share Safari's
// storage, so starting on the group keeps it one tap away after installing.
export const Route = createFileRoute('/manifest.webmanifest')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const start = new URL(request.url).searchParams.get('start')
        const manifest = {
          id: '/',
          name: 'Kwittly',
          short_name: 'Kwittly',
          description: 'Shared expenses without the headache',
          start_url: start && /^\/g\/[A-Za-z0-9]+$/.test(start) ? start : '/groups',
          scope: '/',
          display: 'standalone',
          background_color: '#f6f4ef',
          theme_color: '#f6f4ef',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        }
        return new Response(JSON.stringify(manifest), {
          headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
        })
      },
    },
  },
})
