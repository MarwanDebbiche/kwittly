import { Trans, useLingui } from '@lingui/react/macro'
import { Check, Copy, Share } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from '../ui/Sheet'
import type { Group } from './types'

export function ShareSheet({ group, onClose }: { group: Group; onClose: () => void }) {
  const { t } = useLingui()
  const url = `${window.location.origin}/g/${group._id}`
  const [copied, setCopied] = useState(false)
  const canNativeShare = typeof navigator.share === 'function'

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet title={t`Invite to the group`} onClose={onClose}>
      <p className="text-sm text-muted">
        <Trans>Send this link to the group members. Anyone with the link can view and add expenses.</Trans>
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate text-sm">{url}</span>
        <button onClick={copy} className="btn-primary px-3 py-2 text-sm">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
        </button>
      </div>
      {canNativeShare && (
        <button
          className="btn-ghost mt-3 w-full border border-line"
          onClick={() => navigator.share({ title: group.name, text: t`Join “${group.name}” on Kwittly`, url })}
        >
          <Share className="size-4" /> <Trans>Share via…</Trans>
        </button>
      )}
    </Sheet>
  )
}
