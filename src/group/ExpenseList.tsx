import { convexQuery } from '@convex-dev/react-query'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CATEGORIES, categoryFor } from '../lib/categories'
import { useFormatters } from '../lib/prefs'
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
  const { t, i18n } = useLingui()
  const format = useFormatters()
  const [filters, setFilters] = useState<Filters>({})
  const [selected, setSelected] = useState<Expense | null>(null)
  const { data: expenses } = useQuery(convexQuery(api.expenses.list, { groupId: group._id, ...definedOnly(filters) }))
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
          placeholder={t`Search expenses`}
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
            <Trans>Involves me</Trans>
          </button>
        )}
        <PillSelect
          placeholder={t`Paid by`}
          value={filters.paidBy}
          onChange={(v) => set('paidBy', v)}
          options={people.map((p) => ({ ...p, label: t`Paid by ${p.label}` }))}
        />
        <PillSelect
          placeholder={t`Involves`}
          value={filters.involving}
          onChange={(v) => set('involving', v)}
          options={people.map((p) => ({ ...p, label: t`Involves ${p.label}` }))}
        />
        <PillSelect
          placeholder={t`Category`}
          value={filters.category}
          onChange={(v) => set('category', v)}
          options={CATEGORIES.map((c) => ({ value: c.key, label: i18n._(c.label) }))}
        />
        {hasFilters && (
          <button className="btn-ghost shrink-0 py-1.5" onClick={() => setFilters({})}>
            <X className="size-4" /> <Trans>Clear</Trans>
          </button>
        )}
      </div>

      {expenses === undefined ? (
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-line" />
      ) : expenses.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted">
          {hasFilters ? <Trans>No expenses match these filters.</Trans> : <Trans>No expenses yet. Add the first one!</Trans>}
        </p>
      ) : (
        <>
          {hasFilters && (
            <p className="mt-4 text-sm text-muted">
              <Plural value={expenses.length} one="# expense" other="# expenses" /> ·{' '}
              <span className="font-medium text-ink tabular-nums">
                {format.money(
                  expenses.reduce((sum, e) => sum + e.amountCents, 0),
                  group.currency,
                )}
              </span>
            </p>
          )}
          <div className="mt-4 space-y-5">
            {groupByDay(expenses, format.dayKey).map(([day, items]) => (
              <section key={day}>
                <h3 className="label mb-2 px-1">
                  <DayLabel dayKey={day} timestamp={items[0].date} />
                </h3>
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
  const format = useFormatters()
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
        <span className="block text-sm text-muted">
          {expense.paidBy === me ? <Trans>Paid by you</Trans> : <Trans>Paid by {payer}</Trans>}
        </span>
      </span>
      <span className="text-right">
        <span className="block font-semibold tabular-nums">{format.money(expense.amountCents, currency)}</span>
        {me &&
          (lent > 0 ? (
            <span className="block text-xs text-owed">
              <Trans>you lent {format.money(lent, currency)}</Trans>
            </span>
          ) : myShare > 0 && expense.paidBy !== me ? (
            <span className="block text-xs text-owe">
              <Trans>your share {format.money(myShare, currency)}</Trans>
            </span>
          ) : (
            <span className="block text-xs text-muted">
              <Trans>not involved</Trans>
            </span>
          ))}
      </span>
    </button>
  )
}

/** Expenses by calendar day (in the rendering time zone), newest first. */
function groupByDay(expenses: Expense[], dayKey: (timestamp: number) => string): [string, Expense[]][] {
  const groups = new Map<string, Expense[]>()
  for (const e of expenses) {
    const key = dayKey(e.date)
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  return [...groups]
}

function DayLabel({ dayKey, timestamp }: { dayKey: string; timestamp: number }) {
  const format = useFormatters()
  if (dayKey === format.todayKey()) return <Trans>Today</Trans>
  if (dayKey === format.todayKey(-1)) return <Trans>Yesterday</Trans>
  const sameYear = dayKey.slice(0, 4) === format.todayKey().slice(0, 4)
  return format.date(timestamp, { weekday: 'long', day: 'numeric', month: 'long', year: sameYear ? undefined : 'numeric' })
}

/** Drop unset filters so the query args (and cache key) match the server-rendered ones. */
function definedOnly(filters: Filters): Filters {
  return Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
}
