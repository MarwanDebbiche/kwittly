import { Trans, useLingui } from '@lingui/react/macro'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from '../ui/Sheet'

/**
 * Leaving only removes the group from the user's own list: the group, its
 * expenses and the user's name in them stay for the other members.
 */
export function LeaveGroupSheet({
  groupName,
  fromAccount,
  onConfirm,
  onClose,
}: {
  groupName: string
  /** Logged in: removed from the account (all devices); otherwise from this device only. */
  fromAccount: boolean
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const { t } = useLingui()
  const [pending, setPending] = useState(false)

  return (
    <Sheet title={t`Leave “${groupName}”?`} onClose={onClose}>
      <div className="space-y-3 text-muted">
        <p>
          {fromAccount ? (
            <Trans>The group will be removed from your account, on all your devices.</Trans>
          ) : (
            <Trans>The group will be removed from this device only.</Trans>
          )}
        </p>
        <p>
          <Trans>
            It stays available to the other members, and your name stays in its expenses. You can come back anytime
            with the share link.
          </Trans>
        </p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="btn-ghost border border-line" onClick={onClose}>
          <Trans>Cancel</Trans>
        </button>
        <button
          className="btn-primary bg-owe hover:bg-owe/90"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            try {
              await onConfirm()
            } finally {
              setPending(false)
            }
          }}
        >
          <LogOut className="size-4" /> <Trans>Leave group</Trans>
        </button>
      </div>
    </Sheet>
  )
}
