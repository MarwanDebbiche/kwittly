import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

let convex: ConvexReactClient | undefined

// Created lazily so the websocket client never starts during server rendering.
function getConvexClient() {
  convex ??= new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
  return convex
}

// App pages depend on localStorage and realtime data, and need no SEO:
// render them on the client only.
export const Route = createFileRoute('/_app')({
  ssr: false,
  component: AppLayout,
})

function AppLayout() {
  return (
    <ConvexProvider client={getConvexClient()}>
      <div className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </div>
    </ConvexProvider>
  )
}
