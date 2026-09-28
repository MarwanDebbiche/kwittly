import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Avatar } from '../ui/Avatar'
import type { Group } from './types'

export function WhoAreYou({
  group,
  current,
  onPick,
}: {
  group: Group
  current?: string
  onPick: (me: Id<'participants'> | undefined) => void | Promise<void>
}) {
  const { t } = useLingui()
  const addParticipant = useMutation(api.groups.addParticipant)
  const [newName, setNewName] = useState('')

  async function joinAsNew(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    onPick(await addParticipant({ groupId: group._id, name: newName.trim() }))
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-2">
        {group.participants.map((p) => (
          <li key={p._id}>
            <button
              onClick={() => onPick(p._id)}
              className={`card flex w-full items-center gap-3 p-3 text-left transition hover:border-ink/30 ${
                current === p._id ? 'border-ink ring-1 ring-ink' : ''
              }`}
            >
              <Avatar name={p.name} />
              <span className="truncate font-medium">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={joinAsNew} className="mt-6 space-y-2">
        <span className="label">
          <Trans>Not in the list?</Trans>
        </span>
        <div className="flex gap-2">
          <input className="field" placeholder={t`Your first name`} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={!newName.trim()}>
            <Trans>Join</Trans>
          </button>
        </div>
      </form>
      <button className="btn-ghost mt-3 w-full" onClick={() => onPick(undefined)}>
        <Trans>Just view, without joining</Trans>
      </button>
    </div>
  )
}
