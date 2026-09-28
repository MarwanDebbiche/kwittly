import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '../pages/LoginPage'

// Depends on localStorage: rendered in the browser only.
export const Route = createFileRoute('/_app/login')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Connexion · Kwittly' }] }),
  component: LoginPage,
})
