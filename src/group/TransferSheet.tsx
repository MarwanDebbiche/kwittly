import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from 'convex/react'
import { HandCoins } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { localDay } from '../lib/dates'
import { parseCents, sanitizeAmountInput } from '../lib/money'
import { usePrefs } from '../lib/prefs'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Expense, Group } from './types'

type ParticipantId = Id<'participants'>

/**
 * Records that someone paid someone else back, or edits `transfer` when given.
 * `initial` pre-fills a suggested settlement.
 */
export function TransferSheet({
  group,
  me,
  transfer,
  initial,
  onClose,
}: {
  group: Group
  me?: ParticipantId
  transfer?: Expense
  initial?: { from: ParticipantId; to: ParticipantId; amountCents: number }
  onClose: () => void
}) {
  const { t } = useLingui()
  const { locale } = usePrefs()
  const addTransfer = useMutation(api.expenses.addTransfer)
  const updateTransfer = useMutation(api.expenses.updateTransfer)
  const everyone = group.participants.map((p) => p._id)
  const nameOf = (id: ParticipantId) => (id === me ? t`Me` : (group.participants.find((p) => p._id === id)?.name ?? '?'))
  const toInput = (cents: number) => (cents / 100).toFixed(2).replace('.', locale === 'fr' ? ',' : '.')

  const start = transfer
    ? { from: transfer.paidBy, to: transfer.splits[0]?.participantId, amountCents: transfer.amountCents }
    : initial
  const [amount, setAmount] = useState(() => (start ? toInput(start.amountCents) : ''))
  const [from, setFrom] = useState<ParticipantId | undefined>(start?.from ?? me)
  const [to, setTo] = useState<ParticipantId | undefined>(start?.to)
  const [date, setDate] = useState(() => localDay(transfer?.date ?? Date.now()))
  const [submitting, setSubmitting] = useState(false)

  const amountCents = parseCents(amount)
  const canSubmit = amountCents !== null && from !== undefined && to !== undefined && from !== to && !submitting

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // Noon local time keeps the day stable across timezones.
      const fields = { from, to, amountCents, date: new Date(`${date}T12:00:00`).getTime() }
      if (transfer) await updateTransfer({ expenseId: transfer._id, ...fields })
      else await addTransfer({ groupId: group._id, createdBy: me, ...fields })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const people = (selected: ParticipantId | undefined, onPick: (id: ParticipantId) => void, disabled?: ParticipantId) => (
    <div className="flex flex-wrap gap-2">
      {everyone.map((id) => (
        <button
          type="button"
          key={id}
          onClick={() => onPick(id)}
          disabled={id === disabled}
          className={`chip py-1 pl-1 ${selected === id ? 'chip-on' : ''} ${id === disabled ? 'opacity-40' : ''}`}
        >
          <Avatar name={group.participants.find((p) => p._id === id)?.name ?? '?'} size="sm" />
          {nameOf(id)}
        </button>
      ))}
    </div>
  )

  return (
    <Sheet title={transfer ? t`Edit reimbursement` : t`Record a reimbursement`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="card flex items-baseline justify-center gap-2 px-4 py-5">
          <input
            autoFocus={!start}
            inputMode="decimal"
            placeholder={locale === 'fr' ? '0,00' : '0.00'}
            value={amount}
            onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
            className="w-full min-w-0 bg-transparent text-center font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-line"
            aria-label={t`Amount`}
          />
          <span className="font-display text-2xl text-muted">{group.currency}</span>
        </div>

        <div className="space-y-2">
          <span className="label block">
            <Trans>Paid back by</Trans>
          </span>
          {people(from, (id) => {
            setFrom(id)
            if (id === to) setTo(undefined)
          })}
        </div>

        <div className="space-y-2">
          <span className="label block">
            <Trans>To</Trans>
          </span>
          {people(to, setTo, from)}
        </div>

        <label className="block space-y-2">
          <span className="label">
            <Trans>Date</Trans>
          </span>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button className="btn-primary w-full" disabled={!canSubmit}>
          <HandCoins className="size-4" /> {transfer ? <Trans>Save changes</Trans> : <Trans>Record reimbursement</Trans>}
        </button>
      </form>
    </Sheet>
  )
}

/** "Alice paid Bob back", from the point of view of `me`. */
export function TransferTitle({ transfer, group, me }: { transfer: Expense; group: Group; me?: string }) {
  const nameOf = (id: string | undefined) => group.participants.find((p) => p._id === id)?.name ?? '?'
  const from = nameOf(transfer.paidBy)
  const to = nameOf(transfer.splits[0]?.participantId)
  if (transfer.paidBy === me) return <Trans>You paid {to} back</Trans>
  if (transfer.splits[0]?.participantId === me) return <Trans>{from} paid you back</Trans>
  return <Trans>{from} paid {to} back</Trans>
}
