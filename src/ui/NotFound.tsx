import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-24 text-center">
      <p className="font-display text-3xl font-semibold">
        <Trans>Page not found</Trans>
      </p>
      <Link to="/" className="btn-primary mt-6">
        <Trans>Back to home</Trans>
      </Link>
    </div>
  )
}
