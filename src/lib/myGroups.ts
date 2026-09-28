import { useMutation } from 'convex/react'
import { useEffect, useRef } from 'react'
import { api } from '../../convex/_generated/api'
import { useAccountQuery } from './accountQuery'
import { accountCache, anonymousGroups, upsertGroup, type SavedGroup } from './savedGroups'

export type MyGroups =
  | { status: 'loading' }
  | {
      status: 'ready'
      /** anonymous: localStorage only; account: synced; expired: session lost, showing the cached account list. */
      mode: 'anonymous' | 'account' | 'expired'
      groups: SavedGroup[]
    }

/** Arguments for `groups.summaries`, identical on the server and in the browser. */
export function summaryItems(groups: SavedGroup[]) {
  return groups.map((g) => (g.me ? { groupId: g.id, me: g.me } : { groupId: g.id }))
}

/**
 * The user's groups: from the account when logged in (server-rendered with the
 * session cookie), from localStorage otherwise (known only in the browser).
 */
export function useMyGroups() {
  const remote = useAccountQuery(api.memberships.mine)
  const local = anonymousGroups.useValue()
  const cache = accountCache.useValue()
  const saveRemote = useMutation(api.memberships.save)
  const forgetRemote = useMutation(api.memberships.forget)
  const loggedIn = Array.isArray(remote)

  let state: MyGroups
  if (remote === undefined) state = { status: 'loading' }
  else if (loggedIn) state = { status: 'ready', mode: 'account', groups: remote }
  else if (cache)
    state = {
      status: 'ready',
      mode: 'expired',
      groups: [...local, ...cache.groups.filter((g) => !local.some((l) => l.id === g.id))],
    }
  else state = { status: 'ready', mode: 'anonymous', groups: local }

  async function save(groupId: string, me: string | undefined) {
    if (loggedIn) await saveRemote(me ? { groupId, me } : { groupId })
    else anonymousGroups.set(upsertGroup(anonymousGroups.get(), groupId, me))
  }

  async function forget(groupId: string) {
    if (loggedIn) return void (await forgetRemote({ groupId }))
    anonymousGroups.set(anonymousGroups.get().filter((g) => g.id !== groupId))
    const cached = accountCache.get()
    if (cached) accountCache.set({ ...cached, groups: cached.groups.filter((g) => g.id !== groupId) })
  }

  return { state, save, forget }
}

/**
 * Keeps localStorage and the account in sync while logged in:
 * imports anonymous groups at login and refreshes the account cache.
 */
export function useAccountSync() {
  const user = useAccountQuery(api.users.current)
  const remote = useAccountQuery(api.memberships.mine)
  const importLocal = useMutation(api.memberships.importLocal)
  const importing = useRef(false)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const cached = accountCache.get()
    if (cached && cached.userId !== userId) accountCache.set(null)

    const local = anonymousGroups.get()
    if (local.length === 0 || importing.current) return
    importing.current = true
    importLocal({ items: summaryItems(local) })
      .then(() => anonymousGroups.set([]))
      .finally(() => {
        importing.current = false
      })
  }, [userId, importLocal])

  useEffect(() => {
    if (userId && Array.isArray(remote)) accountCache.set({ userId, groups: remote })
  }, [userId, remote])
}
