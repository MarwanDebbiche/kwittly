import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { useAccountSync } from '../lib/myGroups'

// @convex-dev/better-auth's AuthClient type resolves the session to `never` with our
// TypeScript version; the runtime client is the one it expects.
const providerAuthClient = authClient as unknown as AuthClient

// Server-rendered by default (the group page); routes that depend on
// localStorage opt out with `ssr: false`.
export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { convexQueryClient } = Route.useRouteContext()
  return (
    <ConvexBetterAuthProvider client={convexQueryClient.convexClient} authClient={providerAuthClient}>
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
