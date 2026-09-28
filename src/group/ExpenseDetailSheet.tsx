import { useMutation } from 'convex/react'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { categoryFor } from '../lib/categories'
import { formatCents } from '../lib/money'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import type { Expense, Group } from './types'

export function ExpenseDetailSheet({ expense, group, onClose }: { expense: Expense; group: Group; onClose: () => void }) {
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
          <p className="font-display text-3xl font-semibold tabular-nums">{formatCents(expense.amountCents, group.currency)}</p>
          <p className="text-sm text-muted">
            {expense.category ?? 'Sans catégorie'} ·{' '}
            {new Date(expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="card mt-5 divide-y divide-line">
        <div className="flex items-center gap-3 p-3">
          <Avatar name={names.get(expense.paidBy) ?? '?'} size="sm" />
          <span className="flex-1">
            <span className="font-medium">{names.get(expense.paidBy)}</span> a payé
          </span>
          <span className="font-semibold tabular-nums">{formatCents(expense.amountCents, group.currency)}</span>
        </div>
        {expense.splits.map((s) => (
          <div key={s.participantId} className="flex items-center gap-3 p-3 pl-12 text-sm">
            <span className="flex-1 text-muted">Part de {names.get(s.participantId)}</span>
            <span className="tabular-nums">{formatCents(s.shareCents, group.currency)}</span>
          </div>
        ))}
      </div>

      <button
        className={`mt-5 w-full ${confirming ? 'btn-primary bg-owe hover:bg-owe/90' : 'btn-ghost text-owe hover:bg-owe/10 hover:text-owe'}`}
        onClick={async () => {
          if (!confirming) return setConfirming(true)
          await removeExpense({ expenseId: expense._id })
          onClose()
        }}
      >
        <Trash2 className="size-4" /> {confirming ? 'Confirmer la suppression' : 'Supprimer la dépense'}
      </button>
    </Sheet>
  )
}
