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
  variant,
}: {
  group: Group
  current?: string
  onPick: (me: Id<'participants'> | undefined) => void
  variant?: 'join'
}) {
  const addParticipant = useMutation(api.groups.addParticipant)
  const [newName, setNewName] = useState('')

  async function joinAsNew(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    onPick(await addParticipant({ groupId: group._id, name: newName.trim() }))
  }

  return (
    <div className={variant === 'join' ? 'pt-6' : ''}>
      {variant === 'join' && (
        <>
          <p className="label">Invitation</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{group.name}</h1>
          <p className="mt-2 text-muted">Qui es-tu dans ce groupe ? Ça permet d'afficher ce que tu dois ou ce qu'on te doit.</p>
        </>
      )}
      <ul className={`grid grid-cols-2 gap-2 ${variant === 'join' ? 'mt-6' : ''}`}>
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
        <span className="label">Pas dans la liste ?</span>
        <div className="flex gap-2">
          <input className="field" placeholder="Ton prénom" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={!newName.trim()}>
            Rejoindre
          </button>
        </div>
      </form>
      <button className="btn-ghost mt-3 w-full" onClick={() => onPick(undefined)}>
        Juste consulter, sans rejoindre
      </button>
    </div>
  )
}
