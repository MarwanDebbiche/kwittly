import { createFileRoute } from '@tanstack/react-router'
import { GroupsPage } from '../pages/GroupsPage'

export const Route = createFileRoute('/_app/groups/')({
  head: () => ({ meta: [{ title: 'Mes groupes · Kwittly' }] }),
  component: GroupsPage,
})
