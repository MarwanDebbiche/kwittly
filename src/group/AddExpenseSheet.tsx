import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CATEGORIES } from '../lib/categories'
import { parseCents } from '../lib/money'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Group } from './types'

export function AddExpenseSheet({ group, me, onClose }: { group: Group; me?: Id<'participants'>; onClose: () => void }) {
  const addExpense = useMutation(api.expenses.add)
  const everyone = group.participants.map((p) => p._id)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [paidBy, setPaidBy] = useState<Id<'participants'>>(me ?? everyone[0])
  const [splitBetween, setSplitBetween] = useState(() => new Set(everyone))
  const [category, setCategory] = useState<string>()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  const amountCents = parseCents(amount)
  const canSubmit = amountCents !== null && title.trim() !== '' && splitBetween.size > 0 && !submitting

  function toggle(id: Id<'participants'>) {
    const next = new Set(splitBetween)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSplitBetween(next)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await addExpense({
        groupId: group._id,
        title: title.trim(),
        amountCents,
        paidBy,
        // Noon local time keeps the day stable across timezones.
        date: new Date(`${date}T12:00:00`).getTime(),
        category,
        splitBetween: everyone.filter((id) => splitBetween.has(id)),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet title="Nouvelle dépense" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="card flex items-baseline justify-center gap-2 px-4 py-5">
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full min-w-0 bg-transparent text-center font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-line"
            aria-label="Montant"
          />
          <span className="font-display text-2xl text-muted">{group.currency}</span>
        </div>

        <input className="field" placeholder="Pour quoi ? (ex : Courses Carrefour)" value={title} onChange={(e) => setTitle(e.target.value)} />

        <Section label="Payé par">
          {group.participants.map((p) => (
            <button type="button" key={p._id} onClick={() => setPaidBy(p._id)} className={`chip py-1 pl-1 ${paidBy === p._id ? 'chip-on' : ''}`}>
              <Avatar name={p.name} size="sm" />
              {p._id === me ? 'Moi' : p.name}
            </button>
          ))}
        </Section>

        <Section
          label="Pour qui"
          action={
            <button
              type="button"
              className="text-xs font-medium text-accent"
              onClick={() => setSplitBetween(new Set(splitBetween.size === everyone.length ? [] : everyone))}
            >
              {splitBetween.size === everyone.length ? 'Aucun' : 'Tout le monde'}
            </button>
          }
        >
          {group.participants.map((p) => (
            <button
              type="button"
              key={p._id}
              onClick={() => toggle(p._id)}
              className={`chip py-1 pl-1 ${splitBetween.has(p._id) ? 'chip-on' : 'opacity-60'}`}
            >
              <Avatar name={p.name} size="sm" />
              {p._id === me ? 'Moi' : p.name}
            </button>
          ))}
        </Section>

        <Section label="Catégorie">
          {CATEGORIES.map(({ name, icon: Icon }) => (
            <button
              type="button"
              key={name}
              onClick={() => setCategory(category === name ? undefined : name)}
              className={`chip ${category === name ? 'chip-on' : ''}`}
            >
              <Icon className="size-4" /> {name}
            </button>
          ))}
        </Section>

        <label className="block space-y-2">
          <span className="label">Date</span>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button className="btn-primary w-full" disabled={!canSubmit}>
          Ajouter la dépense
        </button>
      </form>
    </Sheet>
  )
}

function Section({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {action}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
