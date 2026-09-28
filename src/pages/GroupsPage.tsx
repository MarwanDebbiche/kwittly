import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ChevronRight, Plus, Users } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { formatCents } from '../lib/money'
import { forgetGroup, useSavedGroups } from '../lib/savedGroups'
import { AvatarStack } from '../ui/Avatar'
import { BalanceBadge } from '../ui/BalanceBadge'

export function GroupsPage() {
  const saved = useSavedGroups()
  const summaries = useQuery(api.groups.summaries, {
    items: saved.map((g) => (g.me ? { groupId: g.id, me: g.me } : { groupId: g.id })),
  })

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <span className="font-display text-2xl font-bold tracking-tight">
          split<span className="text-accent">mate</span>
        </span>
        <Link to="/groups/new" className="btn-primary size-10 rounded-full p-0" aria-label="Nouveau groupe" title="Nouveau groupe">
          <Plus className="size-5" />
        </Link>
      </header>

      <h1 className="font-display text-3xl font-semibold tracking-tight">Mes groupes</h1>

      {saved.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Users className="size-7" />
          </span>
          <p className="font-medium">Aucun groupe pour l'instant</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Crée un groupe pour ton prochain voyage ou ta coloc, ou ouvre un lien de partage envoyé par un ami.
          </p>
          <Link to="/groups/new" className="btn-primary mt-6">
            <Plus className="size-4" /> Créer un groupe
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
                          <span className="truncate whitespace-nowrap tabular-nums">{formatCents(s.totalCents, s.currency)}</span>
                        </div>
                      </div>
                      {s.myBalanceCents !== null && <BalanceBadge cents={s.myBalanceCents} currency={s.currency} />}
                      <ChevronRight className="size-5 shrink-0 text-muted" />
                    </Link>
                  </li>
                ) : (
                  <li key={s.groupId} className="card flex items-center justify-between border-dashed p-4 text-sm text-muted">
                    Groupe introuvable
                    <button className="btn-ghost" onClick={() => forgetGroup(s.groupId)}>
                      Retirer
                    </button>
                  </li>
                ),
              )}
        </ul>
      )}
    </>
  )
}
