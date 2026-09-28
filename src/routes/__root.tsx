import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../index.css?url'
import { accountCache, anonymousGroups } from '../lib/savedGroups'

// The server cannot read localStorage, so "/" always renders the landing page.
// Returning users (with saved groups) are sent to their groups before first paint.
const redirectReturningUsers = `try{if(location.pathname==='/'){var a=JSON.parse(localStorage.getItem('${anonymousGroups.key}')||'[]'),c=JSON.parse(localStorage.getItem('${accountCache.key}')||'null');if((Array.isArray(a)&&a.length)||(c&&c.groups&&c.groups.length))location.replace('/groups')}}catch(e){}`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#f6f4ef' },
      { title: 'splitmate' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
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
