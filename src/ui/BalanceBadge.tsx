import { formatCents } from '../lib/money'

export function BalanceBadge({ cents, currency, large }: { cents: number; currency: string; large?: boolean }) {
  if (cents === 0) return <span className="text-sm text-muted">À l'équilibre</span>
  const owed = cents > 0
  return (
    <span className={`block leading-tight ${large ? '' : 'text-right'}`}>
      <span className={`block text-xs ${owed ? 'text-owed' : 'text-owe'}`}>{owed ? 'On te doit' : 'Tu dois'}</span>
      <span
        className={`block tabular-nums ${large ? 'font-display text-2xl' : ''} font-semibold ${owed ? 'text-owed' : 'text-owe'}`}
      >
        {formatCents(Math.abs(cents), currency)}
      </span>
    </span>
  )
}
