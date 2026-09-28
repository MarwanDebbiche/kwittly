import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string
// `npx convex deploy` only injects VITE_CONVEX_URL; the HTTP actions URL is derived from it.
const convexSiteUrl =
  (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined) ?? convexUrl.replace(/\.convex\.cloud$/, '.convex.site')

export const { handler, getToken } = convexBetterAuthReactStart({ convexUrl, convexSiteUrl })
