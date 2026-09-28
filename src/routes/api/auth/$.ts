import { createFileRoute } from '@tanstack/react-router'
import { handler } from '../../../lib/auth-server'

// Proxies Better Auth requests to Convex so the session cookie lives on our domain.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
})
