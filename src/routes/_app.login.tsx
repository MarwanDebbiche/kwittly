import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '../pages/LoginPage'

export const Route = createFileRoute('/_app/login')({
  head: () => ({ meta: [{ title: 'Connexion · splitmate' }] }),
  component: LoginPage,
})
