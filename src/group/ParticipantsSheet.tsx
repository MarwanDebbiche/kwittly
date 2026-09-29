import { convexQuery } from '@convex-dev/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from 'convex/react'
import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Group } from './types'

type ParticipantId = Id<'participants'>

/** Add, rename and remove the people of a group. */
export function ParticipantsSheet({ group, me, onClose }: { group: Group; me?: ParticipantId; onClose: () => void }) {
  const { t } = useLingui()
  const addParticipant = useMutation(api.groups.addParticipant)
  const renameParticipant = useMutation(api.groups.renameParticipant)
  const removeParticipant = useMutation(api.groups.removeParticipant)
  // Same args as the route loader, so this is already in the cache.
  const { data: expenses } = useQuery(convexQuery(api.expenses.list, { groupId: group._id }))
  const [editing, setEditing] = useState<{ id: ParticipantId; name: string } | null>(null)
  const [confirming, setConfirming] = useState<ParticipantId | null>(null)
  const [newName, setNewName] = useState('')
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const involved = new Set<string>(expenses?.flatMap((e) => [e.paidBy, ...e.splits.map((s) => s.participantId)]))
  const canRemove = (id: ParticipantId) => expenses !== undefined && !involved.has(id) && group.participants.length > 1

  async function run(action: () => Promise<unknown>) {
    setPending(true)
    setFailed(false)
    try {
      await action()
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setPending(false)
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !editing.name.trim()) return
    if (await run(() => renameParticipant({ participantId: editing.id, name: editing.name }))) setEditing(null)
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    if (await run(() => addParticipant({ groupId: group._id, name: newName }))) setNewName('')
  }

  return (
    <Sheet title={t`Participants`} onClose={onClose}>
      <ul className="card divide-y divide-line">
        {group.participants.map((p) =>
          editing?.id === p._id ? (
            <li key={p._id}>
              <form onSubmit={saveName} className="flex items-center gap-2 px-3 py-2">
                <input
                  autoFocus
                  className="field py-1.5"
                  value={editing.name}
                  onChange={(e) => setEditing({ id: p._id, name: e.target.value })}
                  aria-label={t`Name`}
                />
                <button className="btn-primary shrink-0 p-2" disabled={pending || !editing.name.trim()} aria-label={t`Save`}>
                  <Check className="size-4" />
                </button>
                <button type="button" className="btn-ghost shrink-0 p-2" onClick={() => setEditing(null)} aria-label={t`Cancel`}>
                  <X className="size-4" />
                </button>
              </form>
            </li>
          ) : (
            <li key={p._id} className="flex items-center gap-3 px-3 py-2">
              <Avatar name={p.name} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium">
                {p.name}
                {p._id === me && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    <Trans>(you)</Trans>
                  </span>
                )}
              </span>
              {confirming === p._id ? (
                <>
                  <button className="btn-ghost shrink-0 px-3 py-1.5" onClick={() => setConfirming(null)}>
                    <Trans>Cancel</Trans>
                  </button>
                  <button
                    className="btn-primary shrink-0 bg-owe px-3 py-1.5 hover:bg-owe/90"
                    disabled={pending}
                    onClick={async () => {
                      if (await run(() => removeParticipant({ participantId: p._id }))) setConfirming(null)
                    }}
                  >
                    <Trans>Remove</Trans>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-ghost shrink-0 p-2"
                    onClick={() => {
                      setConfirming(null)
                      setEditing({ id: p._id, name: p.name })
                    }}
                    aria-label={t`Rename ${p.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  {canRemove(p._id) && (
                    <button
                      className="btn-ghost shrink-0 p-2 text-owe hover:bg-owe/10 hover:text-owe"
                      onClick={() => {
                        setEditing(null)
                        setConfirming(p._id)
                      }}
                      aria-label={t`Remove ${p.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </>
              )}
            </li>
          ),
        )}
      </ul>
      <p className="mt-2 px-1 text-xs text-muted">
        <Trans>People who appear in an expense or a reimbursement can be renamed, not removed.</Trans>
      </p>
      {failed && (
        <p className="mt-2 px-1 text-sm text-owe">
          <Trans>Something went wrong, please try again.</Trans>
        </p>
      )}

      <form onSubmit={add} className="mt-6 space-y-2">
        <span className="label">
          <Trans>Add someone</Trans>
        </span>
        <div className="flex gap-2">
          <input className="field" placeholder={t`First name`} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={pending || !newName.trim()}>
            <UserPlus className="size-4" /> <Trans>Add</Trans>
          </button>
        </div>
      </form>
    </Sheet>
  )
}
