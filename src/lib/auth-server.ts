import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string
// `npx convex deploy` only injects VITE_CONVEX_URL; the HTTP actions URL is derived from it.
const convexSiteUrl =
  (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined) ?? convexUrl.replace(/\.convex\.cloud$/, '.convex.site')

const auth = convexBetterAuthReactStart({ convexUrl, convexSiteUrl })

export const handler = auth.handler

/**
 * Convex token for the request's session, or undefined when logged out. If
 * Convex cannot be reached, the page renders as logged out instead of failing
 * (the landing page does not need Convex at all).
 */
export async function getToken() {
  try {
    return await auth.getToken()
  } catch (error) {
    console.warn('Session lookup failed, rendering as logged out:', error)
    return undefined
  }
}
