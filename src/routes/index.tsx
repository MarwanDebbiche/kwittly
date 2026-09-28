import { msg } from '@lingui/core/macro'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getToken } from '../lib/auth-server'
import { hasSavedGroups } from '../lib/savedGroups'
import { LandingPage } from '../pages/LandingPage'

const isLoggedIn = createServerFn({ method: 'GET' }).handler(async () => Boolean(await getToken()))

export const Route = createFileRoute('/')({
  // Logged-in users are redirected on the server (session cookie). Logged-out users
  // with saved groups are redirected by the inline script in __root on full page
  // loads, and here on client-side navigations.
  beforeLoad: async () => {
    if (typeof window !== 'undefined' && hasSavedGroups()) throw redirect({ to: '/groups' })
    if (await isLoggedIn()) throw redirect({ to: '/groups' })
  },
  head: ({ match }) => {
    const { i18n } = match.context
    const description = i18n._(
      msg`Share the expenses of a trip, a flatshare or a night out. Free, no sign-up, with every filter.`,
    )
    return {
      meta: [
        { title: i18n._(msg`Kwittly · Shared expenses without the headache`) },
        { name: 'description', content: description },
        { property: 'og:title', content: 'Kwittly' },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
      ],
    }
  },
  component: LandingPage,
})
