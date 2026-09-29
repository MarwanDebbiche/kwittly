import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { I18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { useEffect, type ReactNode } from 'react'
import { DEFAULT_LOCALE, isLocale, readCookie, resolveLocale } from '../../convex/lib/locale'
import appCss from '../index.css?url'
import { PrefsContext, TIME_ZONE_COOKIE, isTimeZone, rememberTimeZone, type Prefs } from '../lib/prefs'
import { accountCache, anonymousGroups } from '../lib/savedGroups'

// The server cannot read localStorage, so "/" always renders the landing page.
// Returning users (with saved groups) are sent to their groups before first paint.
const redirectReturningUsers = `try{if(location.pathname==='/'){var a=JSON.parse(localStorage.getItem('${anonymousGroups.key}')||'[]'),c=JSON.parse(localStorage.getItem('${accountCache.key}')||'null');if((Array.isArray(a)&&a.length)||(c&&c.groups&&c.groups.length))location.replace('/groups')}}catch(e){}`

/** Language (cookie, then Accept-Language) and time zone (cookie) of the request. */
const getRequestPrefs = createServerFn({ method: 'GET' }).handler((): Prefs => {
  const headers = getRequest().headers
  const timeZone = readCookie(headers.get('cookie'), TIME_ZONE_COOKIE)
  return { locale: resolveLocale(headers), timeZone: isTimeZone(timeZone) ? timeZone : 'UTC' }
})

/** On a group page, the app installed from it opens on that group. */
function manifestHref(matches: { params: Record<string, string> }[]) {
  const groupId = matches.find((m) => m.params.groupId)?.params.groupId
  return groupId ? `/manifest.webmanifest?start=${encodeURIComponent(`/g/${groupId}`)}` : '/manifest.webmanifest'
}

/** In the browser, reuse what the server rendered with (kept on <html>). */
function documentPrefs(): Prefs {
  const root = document.documentElement
  const tz = root.dataset.timeZone
  return {
    locale: isLocale(root.lang) ? root.lang : DEFAULT_LOCALE,
    timeZone: isTimeZone(tz) ? tz : 'UTC',
  }
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
  i18n: I18n
}>()({
  beforeLoad: async ({ context: { i18n } }) => {
    const prefs = typeof window === 'undefined' ? await getRequestPrefs() : documentPrefs()
    if (i18n.locale !== prefs.locale) i18n.activate(prefs.locale)
    return { prefs }
  },
  head: ({ matches }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#f6f4ef' },
      // Installed on the home screen (iOS reads these rather than the manifest).
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Kwittly' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { title: 'Kwittly' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: manifestHref(matches) },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Inter:wght@400;500;600&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { i18n, prefs } = Route.useRouteContext()
  // On hydration, the browser reuses the root context sent by the server
  // without running beforeLoad: align this router's i18n before rendering.
  if (i18n.locale !== prefs.locale) i18n.activate(prefs.locale)
  return (
    <I18nProvider i18n={i18n}>
      <PrefsContext.Provider value={prefs}>
        <RootDocument prefs={prefs}>
          <Outlet />
        </RootDocument>
      </PrefsContext.Provider>
    </I18nProvider>
  )
}

function RootDocument({ prefs, children }: { prefs: Prefs; children: ReactNode }) {
  useEffect(() => rememberTimeZone(prefs.timeZone), [prefs.timeZone])
  return (
    <html lang={prefs.locale} data-time-zone={prefs.timeZone}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: redirectReturningUsers }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
