import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from 'convex/react'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { splitByShares } from '../../convex/lib/money'
import { CATEGORIES } from '../lib/categories'
import { parseCents, sanitizeAmountInput } from '../lib/money'
import { useFormatters, usePrefs } from '../lib/prefs'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Expense, Group } from './types'

type ParticipantId = Id<'participants'>
type SplitMode = 'equal' | 'shares' | 'amounts'

const MAX_SHARES = 1000

/** Calendar day of a timestamp in the browser's time zone, as YYYY-MM-DD (toISOString would give the UTC day). */
function localDay(timestamp: number) {
  return new Intl.DateTimeFormat('en-CA').format(new Date(timestamp))
}

/** Creates an expense, or edits `expense` when given. */
export function ExpenseFormSheet({
  group,
  me,
  expense,
  onClose,
}: {
  group: Group
  me?: ParticipantId
  expense?: Expense
  onClose: () => void
}) {
  const { t, i18n } = useLingui()
  const { locale } = usePrefs()
  const format = useFormatters()
  const addExpense = useMutation(api.expenses.add)
  const updateExpense = useMutation(api.expenses.update)
  const everyone = group.participants.map((p) => p._id)
  const nameOf = (id: ParticipantId) => (id === me ? t`Me` : (group.participants.find((p) => p._id === id)?.name ?? '?'))
  const toInput = (cents: number) => (cents / 100).toFixed(2).replace('.', locale === 'fr' ? ',' : '.')

  const [amount, setAmount] = useState(() => (expense ? toInput(expense.amountCents) : ''))
  const [title, setTitle] = useState(expense?.title ?? '')
  const [paidBy, setPaidBy] = useState<ParticipantId>(expense?.paidBy ?? me ?? everyone[0])
  const [category, setCategory] = useState<string | undefined>(expense?.category)
  const [date, setDate] = useState(() => localDay(expense?.date ?? Date.now()))
  const [submitting, setSubmitting] = useState(false)

  // Split state for each mode; switching mode carries the current split over.
  const [mode, setMode] = useState<SplitMode>(expense?.splitMode ?? 'equal')
  const [included, setIncluded] = useState(() => new Set(expense ? expense.splits.map((s) => s.participantId) : everyone))
  const [shares, setShares] = useState<Record<string, number>>(() =>
    Object.fromEntries(expense ? expense.splits.map((s) => [s.participantId, s.shares ?? 1]) : everyone.map((id) => [id, 1])),
  )
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    expense?.splitMode === 'amounts' ? Object.fromEntries(expense.splits.map((s) => [s.participantId, toInput(s.shareCents)])) : {},
  )

  const amountCents = parseCents(amount)
  const split = computeSplit()

  /** The split in the current mode: what to send, and each participant's share for the preview. */
  function computeSplit() {
    if (mode === 'amounts') {
      const entries = everyone
        .map((id) => ({ participantId: id, amountCents: parseCents(amounts[id] ?? '') }))
        .filter((e): e is { participantId: ParticipantId; amountCents: number } => e.amountCents !== null)
      const assigned = entries.reduce((sum, e) => sum + e.amountCents, 0)
      return {
        payload: { mode, amounts: entries } as const,
        cents: new Map(entries.map((e) => [e.participantId, e.amountCents])),
        count: entries.length,
        remaining: amountCents === null ? null : amountCents - assigned,
      }
    }
    const weights =
      mode === 'shares'
        ? everyone.filter((id) => (shares[id] ?? 0) > 0).map((id) => ({ participantId: id, shares: shares[id] }))
        : everyone.filter((id) => included.has(id)).map((id) => ({ participantId: id, shares: 1 }))
    const cents = splitByShares(amountCents ?? 0, weights.map((w) => w.shares))
    return {
      payload: mode === 'shares' ? ({ mode, shares: weights } as const) : ({ mode, participants: weights.map((w) => w.participantId) } as const),
      cents: new Map(weights.map((w, i) => [w.participantId, cents[i]])),
      count: weights.length,
      remaining: 0,
    }
  }

  function switchMode(next: SplitMode) {
    if (next === mode) return
    const current = [...split.cents.keys()]
    if (next === 'equal') setIncluded(new Set(current))
    if (next === 'shares') setShares(Object.fromEntries(everyone.map((id) => [id, split.cents.has(id) ? Math.max(1, shares[id] ?? 1) : 0])))
    // Start from the current split's amounts, so only the differences need typing.
    if (next === 'amounts' && amountCents !== null)
      setAmounts(Object.fromEntries(current.map((id) => [id, toInput(split.cents.get(id) ?? 0)])))
    setMode(next)
  }

  const canSubmit = amountCents !== null && title.trim() !== '' && split.count > 0 && split.remaining === 0 && !submitting

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const fields = {
        title: title.trim(),
        amountCents,
        paidBy,
        // Noon local time keeps the day stable across timezones.
        date: new Date(`${date}T12:00:00`).getTime(),
        category,
        split: split.payload,
      }
      if (expense) await updateExpense({ expenseId: expense._id, ...fields })
      else await addExpense({ groupId: group._id, ...fields })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const modes: { value: SplitMode; label: string }[] = [
    { value: 'equal', label: t`Equally` },
    { value: 'shares', label: t`By shares` },
    { value: 'amounts', label: t`By amounts` },
  ]
  const preview = (id: ParticipantId) =>
    amountCents !== null && split.cents.has(id) ? format.money(split.cents.get(id) ?? 0, group.currency) : ''

  return (
    <Sheet title={expense ? t`Edit expense` : t`New expense`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="card flex items-baseline justify-center gap-2 px-4 py-5">
          <input
            autoFocus={!expense}
            inputMode="decimal"
            placeholder={locale === 'fr' ? '0,00' : '0.00'}
            value={amount}
            onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
            className="w-full min-w-0 bg-transparent text-center font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-line"
            aria-label={t`Amount`}
          />
          <span className="font-display text-2xl text-muted">{group.currency}</span>
        </div>

        <input className="field" placeholder={t`What for? (e.g. Supermarket)`} value={title} onChange={(e) => setTitle(e.target.value)} />

        <Section label={t`Paid by`}>
          <div className="flex flex-wrap gap-2">
            {group.participants.map((p) => (
              <button type="button" key={p._id} onClick={() => setPaidBy(p._id)} className={`chip py-1 pl-1 ${paidBy === p._id ? 'chip-on' : ''}`}>
                <Avatar name={p.name} size="sm" />
                {nameOf(p._id)}
              </button>
            ))}
          </div>
        </Section>

        <Section label={t`For whom`}>
          <div role="radiogroup" aria-label={t`Split mode`} className="grid grid-cols-3 rounded-xl bg-ink/5 p-1">
            {modes.map((m) => (
              <button
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                key={m.value}
                onClick={() => switchMode(m.value)}
                className={`rounded-lg py-1.5 text-sm font-medium transition ${
                  mode === m.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'equal' && (
            <>
              <div className="flex flex-wrap gap-2">
                {group.participants.map((p) => (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => {
                      const next = new Set(included)
                      if (next.has(p._id)) next.delete(p._id)
                      else next.add(p._id)
                      setIncluded(next)
                    }}
                    className={`chip py-1 pl-1 ${included.has(p._id) ? 'chip-on' : 'opacity-60'}`}
                  >
                    <Avatar name={p.name} size="sm" />
                    {nameOf(p._id)}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  {amountCents !== null && split.count > 0 && (
                    <Trans>{format.money(Math.floor(amountCents / split.count), group.currency)} each</Trans>
                  )}
                </span>
                <button
                  type="button"
                  className="font-medium text-accent"
                  onClick={() => setIncluded(new Set(included.size === everyone.length ? [] : everyone))}
                >
                  {included.size === everyone.length ? <Trans>None</Trans> : <Trans>Everyone</Trans>}
                </button>
              </div>
            </>
          )}

          {mode === 'shares' && (
            <ul className="card divide-y divide-line">
              {group.participants.map((p) => {
                const value = shares[p._id] ?? 0
                const setValue = (n: number) => setShares({ ...shares, [p._id]: Math.min(MAX_SHARES, Math.max(0, n)) })
                return (
                  <li key={p._id} className={`flex items-center gap-3 px-3 py-2 ${value === 0 ? 'opacity-50' : ''}`}>
                    <Avatar name={p.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{nameOf(p._id)}</span>
                    <span className="text-sm text-muted tabular-nums">{preview(p._id)}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" className="chip p-1.5" onClick={() => setValue(value - 1)} aria-label={t`One share less`} disabled={value === 0}>
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                        {value}
                      </span>
                      <button type="button" className="chip p-1.5" onClick={() => setValue(value + 1)} aria-label={t`One share more`}>
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {mode === 'amounts' && (
            <>
              <ul className="card divide-y divide-line">
                {group.participants.map((p) => (
                  <li key={p._id} className="flex items-center gap-3 px-3 py-2">
                    <Avatar name={p.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{nameOf(p._id)}</span>
                    <input
                      inputMode="decimal"
                      placeholder={locale === 'fr' ? '0,00' : '0.00'}
                      value={amounts[p._id] ?? ''}
                      onChange={(e) => setAmounts({ ...amounts, [p._id]: sanitizeAmountInput(e.target.value) })}
                      className="field w-28 py-1.5 text-right tabular-nums"
                      aria-label={t`Amount for ${nameOf(p._id)}`}
                    />
                  </li>
                ))}
              </ul>
              {split.remaining !== null && (
                <p className={`text-xs font-medium ${split.remaining === 0 ? 'text-owed' : 'text-owe'}`}>
                  {split.remaining === 0 ? (
                    <Trans>Everything is assigned.</Trans>
                  ) : split.remaining > 0 ? (
                    <Trans>{format.money(split.remaining, group.currency)} left to assign</Trans>
                  ) : (
                    <Trans>{format.money(-split.remaining, group.currency)} too much</Trans>
                  )}
                </p>
              )}
            </>
          )}
        </Section>

        <Section label={t`Category`}>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setCategory(category === key ? undefined : key)}
                className={`chip ${category === key ? 'chip-on' : ''}`}
              >
                <Icon className="size-4" /> {i18n._(label)}
              </button>
            ))}
          </div>
        </Section>

        <label className="block space-y-2">
          <span className="label">
            <Trans>Date</Trans>
          </span>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button className="btn-primary w-full" disabled={!canSubmit}>
          {expense ? <Trans>Save changes</Trans> : <Trans>Add expense</Trans>}
        </button>
      </form>
    </Sheet>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="label block">{label}</span>
      {children}
    </div>
  )
}
