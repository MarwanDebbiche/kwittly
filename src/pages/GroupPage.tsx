import { convexQuery } from '@convex-dev/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Share2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { AddExpenseSheet } from '../group/AddExpenseSheet'
import { Balances } from '../group/Balances'
import { ExpenseList } from '../group/ExpenseList'
import { ShareSheet } from '../group/ShareSheet'
import { WhoAreYou } from '../group/WhoAreYou'
import { useMyGroups } from '../lib/myGroups'
import { useFormatters } from '../lib/prefs'
import { AvatarStack } from '../ui/Avatar'
import { BalanceBadge } from '../ui/BalanceBadge'
import { Sheet } from '../ui/Sheet'

export function GroupPage({ groupId }: { groupId: string }) {
  const { t } = useLingui()
  const format = useFormatters()
  const navigate = useNavigate()
  // Group data is server-rendered (see the route loader), then kept live.
  const { data: group } = useQuery(convexQuery(api.groups.get, { groupId }))
  const { data: balances } = useQuery(convexQuery(api.balances.get, group ? { groupId: group._id } : 'skip'))
  // Who the user is comes from localStorage or the account: known only in the
  // browser, so the personal parts appear right after hydration.
  const { state, save, forget } = useMyGroups()
  const saved = state.status === 'ready' ? state.groups.find((g) => g.id === groupId) : undefined
  const [tab, setTab] = useState<'expenses' | 'balances'>('expenses')
  const [sheet, setSheet] = useState<'add' | 'share' | 'identity' | null>(null)
  const [joinDismissed, setJoinDismissed] = useState(false)

  if (group === undefined) return <GroupSkeleton />
  if (group === null)
    return (
      <div className="pt-16 text-center">
        <p className="font-display text-2xl font-semibold">
          <Trans>Group not found</Trans>
        </p>
        <p className="mt-2 text-sm text-muted">
          <Trans>The link may be wrong, or the group was deleted.</Trans>
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/groups" className="btn-primary">
            <Trans>My groups</Trans>
          </Link>
          {saved && (
            <button className="btn-ghost" onClick={() => forget(groupId)}>
              <Trans>Remove from my list</Trans>
            </button>
          )}
        </div>
      </div>
    )

  // Opened from a share link: ask who the user is, on top of the group.
  const showJoin = state.status === 'ready' && !saved && !joinDismissed
  const me = group.participants.find((p) => p._id === saved?.me)
  const myBalance = balances?.balances.find((b) => b.participantId === me?._id)?.balanceCents

  return (
    <>
      <header className="mb-5 flex items-center justify-between">
        <BackLink />
        <button className="btn-ghost -mr-2" onClick={() => setSheet('share')}>
          <Share2 className="size-4" /> <Trans>Share</Trans>
        </button>
      </header>

      <h1 className="font-display text-3xl font-semibold tracking-tight">{group.name}</h1>
      <div className="mt-2 flex items-center gap-2 text-sm text-muted">
        <AvatarStack names={group.participants.map((p) => p.name)} max={6} />
        {state.status === 'ready' && (
          <button className="underline-offset-2 hover:text-ink hover:underline" onClick={() => setSheet('identity')}>
            {me ? t`You are ${me.name}` : t`Who are you?`}
          </button>
        )}
      </div>

      <div className="card mt-5 grid grid-cols-2 divide-x divide-line">
        <div className="flex flex-col justify-between p-4">
          <p className="label">
            <Trans>Your balance</Trans>
          </p>
          <div className="mt-1">
            {me && myBalance !== undefined ? (
              <BalanceBadge cents={myBalance} currency={group.currency} large />
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between p-4 text-right">
          <p className="label">
            <Trans>Total spent</Trans>
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {balances ? format.money(balances.totalCents, group.currency) : '…'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-xl bg-ink/5 p-1">
        {(['expenses', 'balances'] as const).map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === name ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {name === 'expenses' ? <Trans>Expenses</Trans> : <Trans>Balances</Trans>}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'expenses' ? (
          <ExpenseList group={group} me={me?._id} />
        ) : (
          <Balances group={group} data={balances} me={me?._id} />
        )}
      </div>

      {state.status === 'ready' && saved && (
        <button
          className="mt-12 block w-full text-center text-xs text-muted hover:text-owe"
          onClick={async () => {
            await forget(groupId)
            navigate({ to: '/' })
          }}
        >
          {state.mode === 'account' ? <Trans>Remove this group from my account</Trans> : <Trans>Remove this group from this device</Trans>}
        </button>
      )}

      <button
        onClick={() => setSheet('add')}
        className="btn-primary fixed right-[max(1rem,calc(50vw-17rem))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 rounded-full px-5 py-3.5 shadow-lg shadow-ink/20"
      >
        <Plus className="size-5" /> <Trans>Expense</Trans>
      </button>

      {sheet === 'add' && <AddExpenseSheet group={group} me={me?._id} onClose={() => setSheet(null)} />}
      {sheet === 'share' && <ShareSheet group={group} onClose={() => setSheet(null)} />}
      {showJoin && (
        <Sheet title={t`Join “${group.name}”`} onClose={() => setJoinDismissed(true)}>
          <p className="mb-5 text-muted">
            <Trans>Who are you in this group? It lets us show what you owe or are owed.</Trans>
          </p>
          <WhoAreYou group={group} onPick={(picked) => save(groupId, picked)} />
        </Sheet>
      )}
      {sheet === 'identity' && (
        <Sheet title={t`Who are you?`} onClose={() => setSheet(null)}>
          <WhoAreYou
            group={group}
            current={saved?.me}
            onPick={async (picked) => {
              await save(groupId, picked)
              setSheet(null)
            }}
          />
        </Sheet>
      )}
    </>
  )
}

function BackLink() {
  return (
    <Link to="/groups" className="btn-ghost -ml-3">
      <ArrowLeft className="size-4" /> <Trans>My groups</Trans>
    </Link>
  )
}

function GroupSkeleton() {
  return (
    <div className="animate-pulse space-y-4 pt-14">
      <div className="h-9 w-2/3 rounded-lg bg-line" />
      <div className="h-5 w-1/3 rounded bg-line" />
      <div className="h-24 rounded-2xl bg-line" />
      <div className="h-40 rounded-2xl bg-line" />
    </div>
  )
}
