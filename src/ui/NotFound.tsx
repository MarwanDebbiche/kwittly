import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-24 text-center">
      <p className="font-display text-3xl font-semibold">Page introuvable</p>
      <Link to="/" className="btn-primary mt-6">
        Retour à l'accueil
      </Link>
    </div>
  )
}
