import { useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { AddExpense } from './AddExpense'
import { Balances } from './Balances'
import { ExpenseList } from './ExpenseList'

export function GroupPage({ groupId }: { groupId: Id<'groups'> }) {
  const group = useQuery(api.groups.get, { groupId })
  const [tab, setTab] = useState<'expenses' | 'balances'>('expenses')

  if (group === undefined) return <p className="text-slate-500">Chargement…</p>
  if (group === null) return <p>Groupe introuvable.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <button
          className="text-sm text-emerald-700 hover:underline"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          Copier le lien
        </button>
      </div>
      <div className="flex gap-2">
        {(['expenses', 'balances'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? 'bg-emerald-600 text-white' : 'bg-white'}`}
          >
            {t === 'expenses' ? 'Dépenses' : 'Équilibre'}
          </button>
        ))}
      </div>
      {tab === 'expenses' ? (
        <>
          <AddExpense group={group} />
          <ExpenseList group={group} />
        </>
      ) : (
        <Balances group={group} />
      )}
    </div>
  )
}
