import { Trans } from '@lingui/react/macro'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { RotateCw } from 'lucide-react'
import { useEffect } from 'react'

/** Error message with "Try again" and "Back to home", used inside pages. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="pt-16 text-center">
      <p className="font-display text-3xl font-semibold">
        <Trans>Something went wrong</Trans>
      </p>
      <p className="mt-3 text-muted">
        <Trans>The page could not be loaded. Check your connection and try again.</Trans>
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button className="btn-primary" onClick={onRetry}>
          <RotateCw className="size-4" /> <Trans>Try again</Trans>
        </button>
        <Link to="/" className="btn-ghost border border-line">
          <Trans>Back to home</Trans>
        </Link>
      </div>
    </div>
  )
}

/** Replaces TanStack Router's default error screen, for any route. Details go to the console only. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-xl px-4 pt-8">
      {/* Re-run the loaders, then clear the error boundary. */}
      <ErrorState onRetry={() => void router.invalidate().then(reset)} />
    </div>
  )
}
