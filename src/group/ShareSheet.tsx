import { Check, Copy, Share } from 'lucide-react'
import { useState } from 'react'
import { groupShareUrl } from '../lib/router'
import { Sheet } from '../ui/Sheet'
import type { Group } from './types'

export function ShareSheet({ group, onClose }: { group: Group; onClose: () => void }) {
  const url = groupShareUrl(group._id)
  const [copied, setCopied] = useState(false)
  const canNativeShare = typeof navigator.share === 'function'

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet title="Inviter dans le groupe" onClose={onClose}>
      <p className="text-sm text-muted">
        Envoie ce lien aux membres du groupe. Toute personne qui a le lien peut voir et ajouter des dépenses.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate text-sm">{url}</span>
        <button onClick={copy} className="btn-primary px-3 py-2 text-sm">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      {canNativeShare && (
        <button
          className="btn-ghost mt-3 w-full border border-line"
          onClick={() => navigator.share({ title: group.name, text: `Rejoins « ${group.name} » sur splitmate`, url })}
        >
          <Share className="size-4" /> Partager via…
        </button>
      )}
    </Sheet>
  )
}
