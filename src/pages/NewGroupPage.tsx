import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { useMyGroups } from '../lib/myGroups'
import { Avatar } from '../ui/Avatar'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY']

export function NewGroupPage() {
  const navigate = useNavigate()
  const createGroup = useMutation(api.groups.create)
  const { save } = useMyGroups()
  const [name, setName] = useState('')
  const [me, setMe] = useState('')
  const [others, setOthers] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [submitting, setSubmitting] = useState(false)

  function addOther() {
    const value = draft.trim()
    if (value && !others.includes(value)) setOthers([...others, value])
    setDraft('')
  }

  const canSubmit = name.trim() !== '' && me.trim() !== '' && !submitting

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const pending = draft.trim() && !others.includes(draft.trim()) ? [...others, draft.trim()] : others
      const { groupId, participantIds } = await createGroup({
        name: name.trim(),
        currency,
        participants: [me.trim(), ...pending],
      })
      await save(groupId, participantIds[0])
      navigate({ to: '/g/$groupId', params: { groupId } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <header className="mb-6">
        <Link to="/" className="btn-ghost -ml-3">
          <ArrowLeft className="size-4" /> Retour
        </Link>
      </header>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nouveau groupe</h1>

      <div className="mt-8 space-y-6">
        <label className="block space-y-2">
          <span className="label">Nom du groupe</span>
          <input
            autoFocus
            className="field text-lg"
            placeholder="Week-end à Lisbonne"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="label">Ton prénom</span>
          <input className="field" placeholder="Alex" value={me} onChange={(e) => setMe(e.target.value)} />
        </label>

        <div className="space-y-2">
          <span className="label">Autres participants</span>
          <div className="flex gap-2">
            <input
              className="field"
              placeholder="Ajouter un prénom"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addOther()
                }
              }}
            />
            <button type="button" onClick={addOther} className="chip rounded-xl px-3.5" aria-label="Ajouter">
              <Plus className="size-4" />
            </button>
          </div>
          {others.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {others.map((other) => (
                <li key={other} className="chip py-1 pl-1">
                  <Avatar name={other} size="sm" />
                  {other}
                  <button
                    type="button"
                    className="text-muted hover:text-ink"
                    onClick={() => setOthers(others.filter((o) => o !== other))}
                    aria-label={`Retirer ${other}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">Tu pourras aussi partager un lien pour que chacun rejoigne le groupe.</p>
        </div>

        <div className="space-y-2">
          <span className="label">Devise</span>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {CURRENCIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCurrency(c)}
                className={`chip ${currency === c ? 'chip-on' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-primary mt-10 w-full" disabled={!canSubmit}>
        Créer le groupe
      </button>
    </form>
  )
}
