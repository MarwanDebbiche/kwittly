import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { parseCents } from '../money'
import { CATEGORIES } from '../categories'
import type { Group } from './types'


export function AddExpense({ group }: { group: Group }) {
  const addExpense = useMutation(api.expenses.add)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState<Id<'participants'>>(group.participants[0]?._id)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [splitBetween, setSplitBetween] = useState(() => new Set(group.participants.map((p) => p._id)))

  if (!open)
    return (
      <button className="btn w-full" onClick={() => setOpen(true)}>
        + Ajouter une dépense
      </button>
    )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountCents = parseCents(amount)
    if (!title.trim() || amountCents === null || splitBetween.size === 0) return
    await addExpense({
      groupId: group._id,
      title: title.trim(),
      amountCents,
      paidBy,
      date: new Date(date).getTime(),
      category: category || undefined,
      splitBetween: [...splitBetween],
    })
    setTitle('')
    setAmount('')
    setOpen(false)
  }

  function toggle(id: Id<'participants'>) {
    const next = new Set(splitBetween)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSplitBetween(next)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className="input w-28"
          inputMode="decimal"
          placeholder={`Montant (${group.currency})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm">
          Payé par
          <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value as Id<'participants'>)}>
            {group.participants.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Catégorie</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <p className="mb-1 text-sm text-slate-600">Partagé entre</p>
        <div className="flex flex-wrap gap-2">
          {group.participants.map((p) => (
            <button
              type="button"
              key={p._id}
              onClick={() => toggle(p._id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                splitBetween.has(p._id) ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'text-slate-500'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn">Ajouter</button>
        <button type="button" className="px-3 text-sm text-slate-500" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </form>
  )
}
