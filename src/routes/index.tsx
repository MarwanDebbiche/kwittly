import { createFileRoute, redirect } from '@tanstack/react-router'
import { hasSavedGroups } from '../lib/savedGroups'
import { LandingPage } from '../pages/LandingPage'

const description =
  "Partagez les dépenses d'un voyage, d'une coloc ou d'une soirée. Gratuit, sans inscription, avec tous les filtres."

export const Route = createFileRoute('/')({
  // Client-side navigations to "/" (a full page load is handled in __root).
  beforeLoad: () => {
    if (typeof window !== 'undefined' && hasSavedGroups()) throw redirect({ to: '/groups' })
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
