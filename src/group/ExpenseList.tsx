import { useQuery } from 'convex/react'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CATEGORIES, categoryFor } from '../lib/categories'
import { formatCents } from '../lib/money'
import { PillSelect } from '../ui/PillSelect'
import { ExpenseDetailSheet } from './ExpenseDetailSheet'
import type { Expense, Group } from './types'

type Filters = {
  paidBy?: Id<'participants'>
  involving?: Id<'participants'>
  category?: string
  search?: string
}

export function ExpenseList({ group, me }: { group: Group; me?: Id<'participants'> }) {
  const [filters, setFilters] = useState<Filters>({})
  const [selected, setSelected] = useState<Expense | null>(null)
  const expenses = useQuery(api.expenses.list, { groupId: group._id, ...filters })
  const names = new Map<string, string>(group.participants.map((p) => [p._id, p.name]))
  const set = (key: keyof Filters, value: string) => setFilters((f) => ({ ...f, [key]: value || undefined }))
  const hasFilters = Object.values(filters).some(Boolean)
  const people = group.participants.map((p) => ({ value: p._id, label: p.name }))

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          className="field pl-10"
          placeholder="Rechercher une dépense"
          value={filters.search ?? ''}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {me && (
          <button
            className={`chip ${filters.involving === me ? 'chip-on' : ''}`}
            onClick={() => set('involving', filters.involving === me ? '' : me)}
          >
            Me concerne
          </button>
        )}
        <PillSelect
          placeholder="Payé par"
          value={filters.paidBy}
          onChange={(v) => set('paidBy', v)}
          options={people.map((p) => ({ ...p, label: `Payé par ${p.label}` }))}
        />
        <PillSelect
          placeholder="Concerne"
          value={filters.involving}
          onChange={(v) => set('involving', v)}
          options={people.map((p) => ({ ...p, label: `Concerne ${p.label}` }))}
        />
        <PillSelect
          placeholder="Catégorie"
          value={filters.category}
          onChange={(v) => set('category', v)}
          options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
        />
        {hasFilters && (
          <button className="btn-ghost shrink-0 py-1.5" onClick={() => setFilters({})}>
            <X className="size-4" /> Effacer
          </button>
        )}
      </div>

      {expenses === undefined ? (
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-line" />
      ) : expenses.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted">
          {hasFilters ? 'Aucune dépense ne correspond à ces filtres.' : 'Aucune dépense. Ajoute la première !'}
        </p>
      ) : (
        <>
          {hasFilters && (
            <p className="mt-4 text-sm text-muted">
              {expenses.length} dépense{expenses.length > 1 ? 's' : ''} ·{' '}
              <span className="font-medium text-ink tabular-nums">
                {formatCents(
                  expenses.reduce((sum, e) => sum + e.amountCents, 0),
                  group.currency,
                )}
              </span>
            </p>
          )}
          <div className="mt-4 space-y-5">
            {groupByDay(expenses).map(([day, items]) => (
              <section key={day}>
                <h3 className="label mb-2 px-1">{day}</h3>
                <ul className="card divide-y divide-line overflow-hidden">
                  {items.map((e) => (
                    <li key={e._id}>
                      <ExpenseRow expense={e} payer={names.get(e.paidBy) ?? '?'} me={me} currency={group.currency} onClick={() => setSelected(e)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {selected && <ExpenseDetailSheet expense={selected} group={group} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ExpenseRow({
  expense,
  payer,
  me,
  currency,
  onClick,
}: {
  expense: Expense
  payer: string
  me?: string
  currency: string
  onClick: () => void
}) {
  const category = categoryFor(expense.category)
  const Icon = category.icon
  const myShare = expense.splits.find((s) => s.participantId === me)?.shareCents ?? 0
  const lent = expense.paidBy === me ? expense.amountCents - myShare : 0

  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${category.tint}`}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{expense.title}</span>
        <span className="block text-sm text-muted">Payé par {expense.paidBy === me ? 'toi' : payer}</span>
      </span>
      <span className="text-right">
        <span className="block font-semibold tabular-nums">{formatCents(expense.amountCents, currency)}</span>
        {me &&
          (lent > 0 ? (
            <span className="block text-xs text-owed">tu prêtes {formatCents(lent, currency)}</span>
          ) : myShare > 0 && expense.paidBy !== me ? (
            <span className="block text-xs text-owe">ta part {formatCents(myShare, currency)}</span>
          ) : (
            <span className="block text-xs text-muted">non concerné</span>
          ))}
      </span>
    </button>
  )
}

function groupByDay(expenses: Expense[]): [string, Expense[]][] {
  const groups = new Map<string, Expense[]>()
  for (const e of expenses) {
    const label = dayLabel(e.date)
    groups.set(label, [...(groups.get(label) ?? []), e])
  }
  return [...groups]
}

function dayLabel(timestamp: number) {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}
