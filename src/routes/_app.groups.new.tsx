import { createFileRoute } from '@tanstack/react-router'
import { NewGroupPage } from '../pages/NewGroupPage'

// Depends on localStorage: rendered in the browser only.
export const Route = createFileRoute('/_app/groups/new')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Nouveau groupe · Kwittly' }] }),
  component: NewGroupPage,
})
