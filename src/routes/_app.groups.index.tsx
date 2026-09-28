import { createFileRoute } from '@tanstack/react-router'
import { GroupsPage } from '../pages/GroupsPage'

// Depends on localStorage: rendered in the browser only.
export const Route = createFileRoute('/_app/groups/')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Mes groupes · Kwittly' }] }),
  component: GroupsPage,
})
