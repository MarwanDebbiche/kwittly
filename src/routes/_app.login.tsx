import { msg } from '@lingui/core/macro'
import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '../pages/LoginPage'

// Depends on localStorage: rendered in the browser only.
export const Route = createFileRoute('/_app/login')({
  ssr: false,
  head: ({ match }) => ({ meta: [{ title: match.context.i18n._(msg`Log in · Kwittly`) }] }),
  component: LoginPage,
})
