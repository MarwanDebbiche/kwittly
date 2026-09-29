import { Trans, useLingui } from '@lingui/react/macro'
import { ArrowRight, HandCoins } from 'lucide-react'
import { useState } from 'react'
import type { Id } from '../../convex/_generated/dataModel'
import { useFormatters } from '../lib/prefs'
import { Avatar } from '../ui/Avatar'
import { TransferSheet } from './TransferSheet'
import type { BalancesData, Group } from './types'

export function Balances({ group, data, me }: { group: Group; data: BalancesData | undefined; me?: Id<'participants'> }) {
  const { t } = useLingui()
  const format = useFormatters()
  // Reimbursement being recorded: a suggested settlement, or blank.
  const [recording, setRecording] = useState<BalancesData['settlements'][number] | 'blank' | null>(null)
  if (!data) return <div className="h-48 animate-pulse rounded-2xl bg-line" />
  const names = new Map<string, string>(group.participants.map((p) => [p._id, p.name]))
  const label = (id: string) => (id === me ? t`You` : (names.get(id) ?? '?'))
  const max = Math.max(1, ...data.balances.map((b) => Math.abs(b.balanceCents)))

  return (
    <div className="space-y-8">
      <section>
        <h3 className="label mb-2 px-1">
          <Trans>Balances</Trans>
        </h3>
        <ul className="card divide-y divide-line">
          {data.balances.map((b) => {
            const width = `${(Math.abs(b.balanceCents) / max) * 50}%`
            return (
              <li key={b.participantId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={names.get(b.participantId) ?? '?'} size="sm" />
                <span className="w-20 truncate text-sm font-medium">{label(b.participantId)}</span>
                <span className="relative h-2 flex-1 rounded-full bg-canvas">
                  <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                  {b.balanceCents !== 0 && (
                    <span
                      className={`absolute inset-y-0 rounded-full ${b.balanceCents > 0 ? 'left-1/2 bg-owed' : 'right-1/2 bg-owe'}`}
                      style={{ width }}
                    />
                  )}
                </span>
                <span
                  className={`w-24 text-right text-sm font-semibold tabular-nums ${
                    b.balanceCents > 0 ? 'text-owed' : b.balanceCents < 0 ? 'text-owe' : 'text-muted'
                  }`}
                >
                  {b.balanceCents > 0 && '+'}
                  {format.money(b.balanceCents, group.currency)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="label mb-2 px-1">
          <Trans>To settle up</Trans>
        </h3>
        {data.settlements.length === 0 ? (
          <p className="card px-4 py-8 text-center text-sm text-muted">
            <Trans>Everyone is even.</Trans>
          </p>
        ) : (
          <ul className="space-y-2">
            {data.settlements.map((s, i) => {
              const involvesMe = s.from === me || s.to === me
              return (
                <li key={i}>
                  <button
                    onClick={() => setRecording(s)}
                    className={`card flex w-full items-center gap-3 px-4 py-3 text-left transition hover:border-ink/30 ${involvesMe ? 'border-ink/30 ring-1 ring-ink/10' : ''}`}
                  >
                    <Avatar name={names.get(s.from) ?? '?'} size="sm" />
                    <span className="min-w-0 truncate text-sm font-medium">{label(s.from)}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted" />
                    <Avatar name={names.get(s.to) ?? '?'} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{label(s.to)}</span>
                    <span className="font-semibold tabular-nums">{format.money(s.amountCents, group.currency)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-2 px-1 text-xs text-muted">
          <Trans>The fewest transfers needed for everyone to be even. Tap one once it's paid to record it.</Trans>
        </p>
        <button className="btn-ghost mt-3 w-full border border-line text-ink" onClick={() => setRecording('blank')}>
          <HandCoins className="size-4" /> <Trans>Record a reimbursement</Trans>
        </button>
      </section>

      {recording && (
        <TransferSheet
          group={group}
          me={me}
          initial={recording === 'blank' ? undefined : recording}
          onClose={() => setRecording(null)}
        />
      )}
    </div>
  )
}
