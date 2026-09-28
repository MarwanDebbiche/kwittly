import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CATEGORIES } from '../lib/categories'
import { parseCents } from '../lib/money'
import { usePrefs } from '../lib/prefs'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Expense, Group } from './types'

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
  me?: Id<'participants'>
  expense?: Expense
  onClose: () => void
}) {
  const { t, i18n } = useLingui()
  const { locale } = usePrefs()
  const addExpense = useMutation(api.expenses.add)
  const updateExpense = useMutation(api.expenses.update)
  const everyone = group.participants.map((p) => p._id)
  const decimalSeparator = locale === 'fr' ? ',' : '.'
  const [amount, setAmount] = useState(() =>
    expense ? (expense.amountCents / 100).toFixed(2).replace('.', decimalSeparator) : '',
  )
  const [title, setTitle] = useState(expense?.title ?? '')
  const [paidBy, setPaidBy] = useState<Id<'participants'>>(expense?.paidBy ?? me ?? everyone[0])
  const [splitBetween, setSplitBetween] = useState(
    () => new Set(expense ? expense.splits.map((s) => s.participantId) : everyone),
  )
  const [category, setCategory] = useState<string | undefined>(expense?.category)
  const [date, setDate] = useState(() => localDay(expense?.date ?? Date.now()))
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
      const fields = {
        title: title.trim(),
        amountCents,
        paidBy,
        // Noon local time keeps the day stable across timezones.
        date: new Date(`${date}T12:00:00`).getTime(),
        category,
        splitBetween: everyone.filter((id) => splitBetween.has(id)),
      }
      if (expense) await updateExpense({ expenseId: expense._id, ...fields })
      else await addExpense({ groupId: group._id, ...fields })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet title={expense ? t`Edit expense` : t`New expense`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="card flex items-baseline justify-center gap-2 px-4 py-5">
          <input
            autoFocus={!expense}
            inputMode="decimal"
            placeholder={locale === 'fr' ? '0,00' : '0.00'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full min-w-0 bg-transparent text-center font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-line"
            aria-label={t`Amount`}
          />
          <span className="font-display text-2xl text-muted">{group.currency}</span>
        </div>

        <input className="field" placeholder={t`What for? (e.g. Supermarket)`} value={title} onChange={(e) => setTitle(e.target.value)} />

        <Section label={t`Paid by`}>
          {group.participants.map((p) => (
            <button type="button" key={p._id} onClick={() => setPaidBy(p._id)} className={`chip py-1 pl-1 ${paidBy === p._id ? 'chip-on' : ''}`}>
              <Avatar name={p.name} size="sm" />
              {p._id === me ? t`Me` : p.name}
            </button>
          ))}
        </Section>

        <Section
          label={t`For whom`}
          action={
            <button
              type="button"
              className="text-xs font-medium text-accent"
              onClick={() => setSplitBetween(new Set(splitBetween.size === everyone.length ? [] : everyone))}
            >
              {splitBetween.size === everyone.length ? <Trans>None</Trans> : <Trans>Everyone</Trans>}
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
              {p._id === me ? t`Me` : p.name}
            </button>
          ))}
        </Section>

        <Section label={t`Category`}>
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
