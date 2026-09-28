import { Trans } from '@lingui/react/macro'
import { useFormatters } from '../lib/prefs'

export function BalanceBadge({ cents, currency, large }: { cents: number; currency: string; large?: boolean }) {
  const format = useFormatters()
  if (cents === 0)
    return (
      <span className="text-sm text-muted">
        <Trans>Settled up</Trans>
      </span>
    )
  const owed = cents > 0
  return (
    <span className={`block leading-tight ${large ? '' : 'text-right'}`}>
      <span className={`block text-xs ${owed ? 'text-owed' : 'text-owe'}`}>{owed ? <Trans>You are owed</Trans> : <Trans>You owe</Trans>}</span>
      <span
        className={`block tabular-nums ${large ? 'font-display text-2xl' : ''} font-semibold ${owed ? 'text-owed' : 'text-owe'}`}
      >
        {format.money(Math.abs(cents), currency)}
      </span>
    </span>
  )
}
