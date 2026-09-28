import { convexQuery } from '@convex-dev/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Cloud, Plus, Users } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { summaryItems, useMyGroups } from '../lib/myGroups'
import { useFormatters } from '../lib/prefs'
import { AccountMenu } from '../ui/AccountMenu'
import { AvatarStack } from '../ui/Avatar'
import { BalanceBadge } from '../ui/BalanceBadge'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { Wordmark } from '../ui/Wordmark'

export function GroupsPage() {
  const { t } = useLingui()
  const format = useFormatters()
  const { state, forget } = useMyGroups()
  const saved = state.status === 'ready' ? state.groups : undefined
  const { data: summaries } = useQuery(
    convexQuery(api.groups.summaries, saved ? { items: summaryItems(saved) } : 'skip'),
  )

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-2">
          <AccountMenu />
          <Link to="/groups/new" className="btn-primary size-10 rounded-full p-0" aria-label={t`New group`} title={t`New group`}>
            <Plus className="size-5" />
          </Link>
        </div>
      </header>

      <h1 className="font-display text-3xl font-semibold tracking-tight">
        <Trans>My groups</Trans>
      </h1>

      {state.status === 'ready' && state.mode === 'expired' && (
        <Banner text={t`Your session has expired. Log in again to sync your groups.`} cta={t`Log in again`} />
      )}
      {state.status === 'ready' && state.mode === 'anonymous' && state.groups.length > 0 && (
        <Banner text={t`Log in to get your groups on all your devices.`} cta={t`Log in`} />
      )}

      {saved === undefined ? (
        <ul className="mt-6 space-y-3">
          <li className="card h-[92px] animate-pulse" />
        </ul>
      ) : saved.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Users className="size-7" />
          </span>
          <p className="font-medium">
            <Trans>No groups yet</Trans>
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            <Trans>Create a group for your next trip or your flatshare, or open a link a friend sent you.</Trans>
          </p>
          <Link to="/groups/new" className="btn-primary mt-6">
            <Plus className="size-4" /> <Trans>Create a group</Trans>
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {summaries === undefined
            ? saved.map((g) => <li key={g.id} className="card h-[92px] animate-pulse" />)
            : summaries.map((s) =>
                s.found ? (
                  <li key={s.groupId}>
                    <Link
                      to="/g/$groupId"
                      params={{ groupId: s.groupId }}
                      className="card flex items-center gap-4 p-4 transition hover:border-ink/25 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-semibold">{s.name}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted">
                          <AvatarStack names={s.participants.map((p) => p.name)} />
                          <span className="truncate whitespace-nowrap tabular-nums">{format.money(s.totalCents, s.currency)}</span>
                        </div>
                      </div>
                      {s.myBalanceCents !== null && <BalanceBadge cents={s.myBalanceCents} currency={s.currency} />}
                      <ChevronRight className="size-5 shrink-0 text-muted" />
                    </Link>
                  </li>
                ) : (
                  <li key={s.groupId} className="card flex items-center justify-between border-dashed p-4 text-sm text-muted">
                    <Trans>Group not found</Trans>
                    <button className="btn-ghost" onClick={() => forget(s.groupId)}>
                      <Trans>Remove</Trans>
                    </button>
                  </li>
                ),
              )}
        </ul>
      )}

      <footer className="mt-12 flex justify-center">
        <LanguageSwitcher />
      </footer>
    </>
  )
}

function Banner({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm">
      <Cloud className="size-5 shrink-0 text-accent" />
      <p className="flex-1">{text}</p>
      <Link to="/login" className="shrink-0 font-medium text-accent hover:underline">
        {cta}
      </Link>
    </div>
  )
}
