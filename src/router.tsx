import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createI18n } from './lib/i18n'
import { NotFound } from './ui/NotFound'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  // One Convex client for the whole app. On the server, queries go over HTTP
  // and their results are embedded in the HTML; in the browser, the same
  // queries are then kept live over the WebSocket (opened on first use).
  const convexQueryClient = new ConvexQueryClient(import.meta.env.VITE_CONVEX_URL as string)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    // i18n is per router, so per request on the server (see createI18n).
    context: { queryClient, convexQueryClient, i18n: createI18n() },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
