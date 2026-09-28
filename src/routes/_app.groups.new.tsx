import { createFileRoute } from '@tanstack/react-router'
import { NewGroupPage } from '../pages/NewGroupPage'

export const Route = createFileRoute('/_app/groups/new')({
  head: () => ({ meta: [{ title: 'Nouveau groupe · Kwittly' }] }),
  component: NewGroupPage,
})
