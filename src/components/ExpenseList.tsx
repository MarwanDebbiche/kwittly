import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { formatCents } from '../money'
import { CATEGORIES } from '../categories'
import type { Group } from './types'

type Filters = {
  paidBy?: Id<'participants'>
  involving?: Id<'participants'>
  category?: string
  search?: string
}

export function ExpenseList({ group }: { group: Group }) {
  const [filters, setFilters] = useState<Filters>({})
  const expenses = useQuery(api.expenses.list, { groupId: group._id, ...filters })
  const removeExpense = useMutation(api.expenses.remove)
  const names = new Map(group.participants.map((p) => [p._id, p.name]))
  const set = <K extends keyof Filters>(key: K, value: string) =>
    setFilters((f) => ({ ...f, [key]: value || undefined }))

  const total = expenses?.reduce((sum, e) => sum + e.amountCents, 0) ?? 0
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
        <input
          className="input flex-1"
          placeholder="Rechercher…"
          value={filters.search ?? ''}
          onChange={(e) => set('search', e.target.value)}
        />
        <select className="input" value={filters.paidBy ?? ''} onChange={(e) => set('paidBy', e.target.value)}>
          <option value="">Payé par : tous</option>
          {group.participants.map((p) => (
            <option key={p._id} value={p._id}>
              Payé par {p.name}
            </option>
          ))}
        </select>
        <select className="input" value={filters.involving ?? ''} onChange={(e) => set('involving', e.target.value)}>
          <option value="">Concerne : tous</option>
          {group.participants.map((p) => (
            <option key={p._id} value={p._id}>
              Concerne {p.name}
            </option>
          ))}
        </select>
        <select className="input" value={filters.category ?? ''} onChange={(e) => set('category', e.target.value)}>
          <option value="">Catégorie : toutes</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {hasFilters && (
          <button className="text-sm text-slate-500 hover:underline" onClick={() => setFilters({})}>
            Réinitialiser
          </button>
        )}
      </div>

      {expenses === undefined ? (
        <p className="text-slate-500">Chargement…</p>
      ) : expenses.length === 0 ? (
        <p className="text-center text-slate-500">Aucune dépense.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            {expenses.length} dépense(s) · total {formatCents(total, group.currency)}
          </p>
          <ul className="divide-y rounded-xl bg-white shadow-sm">
            {expenses.map((e) => (
              <li key={e._id} className="group flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {names.get(e.paidBy)} · {new Date(e.date).toLocaleDateString('fr-FR')}
                    {e.category && ` · ${e.category}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCents(e.amountCents, group.currency)}</span>
                  <button
                    className="text-xs text-red-500 opacity-0 group-hover:opacity-100"
                    onClick={() => removeExpense({ expenseId: e._id })}
                  >
                    Suppr.
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
