import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { useMutation } from 'convex/react'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { categoryFor } from '../lib/categories'
import { useFormatters } from '../lib/prefs'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Expense, Group } from './types'

export function ExpenseDetailSheet({
  expense,
  group,
  onEdit,
  onClose,
}: {
  expense: Expense
  group: Group
  onEdit: () => void
  onClose: () => void
}) {
  const { i18n } = useLingui()
  const format = useFormatters()
  const removeExpense = useMutation(api.expenses.remove)
  const [confirming, setConfirming] = useState(false)
  const names = new Map<string, string>(group.participants.map((p) => [p._id, p.name]))
  const category = categoryFor(expense.category)
  const Icon = category.icon

  return (
    <Sheet title={expense.title} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className={`flex size-12 items-center justify-center rounded-2xl ${category.tint}`}>
          <Icon className="size-6" />
        </span>
        <div>
          <p className="font-display text-3xl font-semibold tabular-nums">{format.money(expense.amountCents, group.currency)}</p>
          <p className="text-sm text-muted">
            {expense.category ? i18n._(category.label) : <Trans>No category</Trans>} ·{' '}
            {format.date(expense.date, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <p className="label mt-5 mb-2 px-1">
        {expense.splitMode === 'shares' ? (
          <Trans>Split by shares</Trans>
        ) : expense.splitMode === 'amounts' ? (
          <Trans>Split by amounts</Trans>
        ) : (
          <Trans>Split equally</Trans>
        )}
      </p>
      <div className="card divide-y divide-line">
        <div className="flex items-center gap-3 p-3">
          <Avatar name={names.get(expense.paidBy) ?? '?'} size="sm" />
          <span className="flex-1">
            <Trans>
              <span className="font-medium">{names.get(expense.paidBy)}</span> paid
            </Trans>
          </span>
          <span className="font-semibold tabular-nums">{format.money(expense.amountCents, group.currency)}</span>
        </div>
        {expense.splits.map((s) => (
          <div key={s.participantId} className="flex items-center gap-3 p-3 pl-12 text-sm">
            <span className="flex-1 text-muted">
              <Trans>{names.get(s.participantId)}'s share</Trans>
              {s.shares !== undefined && (
                <>
                  {' · '}
                  <Plural value={s.shares} one="# share" other="# shares" />
                </>
              )}
            </span>
            <span className="tabular-nums">{format.money(s.shareCents, group.currency)}</span>
          </div>
        ))}
      </div>

      <button className="btn-ghost mt-5 w-full border border-line text-ink" onClick={onEdit}>
        <Pencil className="size-4" /> <Trans>Edit expense</Trans>
      </button>
      <button
        className={`mt-2 w-full ${confirming ? 'btn-primary bg-owe hover:bg-owe/90' : 'btn-ghost text-owe hover:bg-owe/10 hover:text-owe'}`}
        onClick={async () => {
          if (!confirming) return setConfirming(true)
          await removeExpense({ expenseId: expense._id })
          onClose()
        }}
      >
        <Trash2 className="size-4" /> {confirming ? <Trans>Confirm deletion</Trans> : <Trans>Delete expense</Trans>}
      </button>
    </Sheet>
  )
}
