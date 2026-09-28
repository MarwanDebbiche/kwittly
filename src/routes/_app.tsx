import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ConvexReactClient } from 'convex/react'
import { authClient } from '../lib/auth-client'
import { useAccountSync } from '../lib/myGroups'

// @convex-dev/better-auth's AuthClient type resolves the session to `never` with our
// TypeScript version; the runtime client is the one it expects.
const providerAuthClient = authClient as unknown as AuthClient

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
    <ConvexBetterAuthProvider client={getConvexClient()} authClient={providerAuthClient}>
      <AccountSync />
      <div className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </div>
    </ConvexBetterAuthProvider>
  )
}

function AccountSync() {
  useAccountSync()
  return null
}
