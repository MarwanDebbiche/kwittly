import { msg } from '@lingui/core/macro'
import { createFileRoute } from '@tanstack/react-router'
import { NewGroupPage } from '../pages/NewGroupPage'

// Depends on localStorage: rendered in the browser only.
export const Route = createFileRoute('/_app/groups/new')({
  ssr: false,
  head: ({ match }) => ({ meta: [{ title: match.context.i18n._(msg`New group · Kwittly`) }] }),
  component: NewGroupPage,
})
