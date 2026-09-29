import { Trans, useLingui } from '@lingui/react/macro'
import { Share, SquarePlus } from 'lucide-react'
import type { useInstallMethod } from '../lib/install'
import { Sheet } from '../ui/Sheet'

/** Explains how to add Kwittly to the home screen, to find the group again in one tap. */
export function InstallSheet({
  install,
  onClose,
}: {
  install: NonNullable<ReturnType<typeof useInstallMethod>>
  onClose: () => void
}) {
  const { t } = useLingui()

  return (
    <Sheet title={t`Keep Kwittly on your phone`} onClose={onClose}>
      <div className="flex items-center gap-4">
        <img src="/apple-touch-icon.png" alt="" className="size-14 shrink-0 rounded-2xl" />
        <p className="text-muted">
          <Trans>Add it to your home screen to get back to this group in one tap, like an app. No store, nothing to download.</Trans>
        </p>
      </div>

      {install.method === 'ios' ? (
        <ol className="card mt-5 divide-y divide-line">
          <li className="flex items-center gap-3 p-3">
            <Step n={1} />
            <span className="flex-1">
              <Trans>
                Tap <Share className="mx-0.5 inline size-4 align-[-2px]" aria-label={t`Share`} /> Share in Safari (in the ⋯ menu on
                recent iPhones)
              </Trans>
            </span>
          </li>
          <li className="flex items-center gap-3 p-3">
            <Step n={2} />
            <span className="flex-1">
              <Trans>
                Choose <SquarePlus className="mx-0.5 inline size-4 align-[-2px]" aria-hidden /> <b>Add to Home Screen</b>
              </Trans>
            </span>
          </li>
          <li className="flex items-center gap-3 p-3">
            <Step n={3} />
            <span className="flex-1">
              <Trans>
                Tap <b>Add</b>
              </Trans>
            </span>
          </li>
        </ol>
      ) : (
        <button
          className="btn-primary mt-5 w-full"
          onClick={async () => {
            await install.install()
            onClose()
          }}
        >
          <SquarePlus className="size-4" /> <Trans>Add to home screen</Trans>
        </button>
      )}

      <button className="btn-ghost mt-2 w-full" onClick={onClose}>
        {install.method === 'ios' ? <Trans>Got it</Trans> : <Trans>Not now</Trans>}
      </button>
    </Sheet>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{n}</span>
  )
}
