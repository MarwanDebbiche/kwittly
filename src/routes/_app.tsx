import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react'
import { convexQuery } from '@convex-dev/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { api } from '../../convex/_generated/api'
import { authClient } from '../lib/auth-client'
import { getToken } from '../lib/auth-server'
import { useAccountSync } from '../lib/myGroups'
import { SiteFooter } from '../ui/SiteFooter'

// @convex-dev/better-auth's AuthClient type resolves the session to `never` with our
// TypeScript version; the runtime client is the one it expects.
const providerAuthClient = authClient as unknown as AuthClient

const fetchAuthToken = createServerFn({ method: 'GET' }).handler(async () => (await getToken()) ?? null)

// Server-rendered: logged-in users get their account data in the HTML (session
// cookie), anonymous users get it right after hydration (localStorage).
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context: { queryClient, convexQueryClient } }) => {
    // Only for the server-rendered first page load; in the browser, the auth
    // provider handles the session itself.
    if (typeof window !== 'undefined') return { initialToken: undefined }
    const token = await fetchAuthToken()
    if (token) {
      // The router (and so this HTTP client) is created per request.
      convexQueryClient.serverHttpClient?.setAuth(token)
      try {
        await Promise.all([
          queryClient.ensureQueryData(convexQuery(api.memberships.mine, {})),
          queryClient.ensureQueryData(convexQuery(api.users.current, {})),
        ])
      } catch (error) {
        // Only a head start: the browser fetches the account itself once connected.
        console.warn('Account prefetch failed:', error)
      }
    }
    return { initialToken: token ?? undefined }
  },
  // Pages may contain personal data: never store them in a shared cache.
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  component: AppLayout,
})

function AppLayout() {
  const { convexQueryClient, initialToken } = Route.useRouteContext()
  return (
    <ConvexBetterAuthProvider
      client={convexQueryClient.convexClient}
      authClient={providerAuthClient}
      initialToken={initialToken}
    >
      <AccountSync />
      <div className="flex min-h-dvh flex-col">
        {/* Flex column so a page can fill the height above the footer. */}
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </ConvexBetterAuthProvider>
  )
}

function AccountSync() {
  useAccountSync()
  return null
}
