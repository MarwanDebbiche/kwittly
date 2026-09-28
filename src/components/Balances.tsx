import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { formatCents } from '../money'
import type { Group } from './types'

export function Balances({ group }: { group: Group }) {
  const data = useQuery(api.balances.get, { groupId: group._id })
  if (!data) return <p className="text-slate-500">Chargement…</p>
  const names = new Map<string, string>(group.participants.map((p) => [p._id, p.name]))

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-xl bg-white shadow-sm">
        {data.balances.map((b) => (
          <li key={b.participantId} className="flex justify-between p-3">
            <span>{names.get(b.participantId)}</span>
            <span className={b.balanceCents >= 0 ? 'text-emerald-600' : 'text-red-500'}>
              {b.balanceCents > 0 && '+'}
              {formatCents(b.balanceCents, group.currency)}
            </span>
          </li>
        ))}
      </ul>
      <h2 className="font-semibold">Remboursements suggérés</h2>
      {data.settlements.length === 0 ? (
        <p className="text-slate-500">Tout le monde est à l'équilibre 🎉</p>
      ) : (
        <ul className="divide-y rounded-xl bg-white shadow-sm">
          {data.settlements.map((s, i) => (
            <li key={i} className="flex justify-between p-3">
              <span>
                {names.get(s.from)} → {names.get(s.to)}
              </span>
              <span className="font-semibold">{formatCents(s.amountCents, group.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
