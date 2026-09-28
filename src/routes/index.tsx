import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getToken } from '../lib/auth-server'
import { hasSavedGroups } from '../lib/savedGroups'
import { LandingPage } from '../pages/LandingPage'

const description =
  "Partagez les dépenses d'un voyage, d'une coloc ou d'une soirée. Gratuit, sans inscription, avec tous les filtres."

const isLoggedIn = createServerFn({ method: 'GET' }).handler(async () => Boolean(await getToken()))

export const Route = createFileRoute('/')({
  // Logged-in users are redirected on the server (session cookie). Logged-out users
  // with saved groups are redirected by the inline script in __root on full page
  // loads, and here on client-side navigations.
  beforeLoad: async () => {
    if (typeof window !== 'undefined' && hasSavedGroups()) throw redirect({ to: '/groups' })
    if (await isLoggedIn()) throw redirect({ to: '/groups' })
  },
  head: () => ({
    meta: [
      { title: 'splitmate · Les comptes entre amis, sans prise de tête' },
      { name: 'description', content: description },
      { property: 'og:title', content: 'splitmate' },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: LandingPage,
})
