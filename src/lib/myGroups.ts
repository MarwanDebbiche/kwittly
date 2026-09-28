import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useEffect, useRef } from 'react'
import { api } from '../../convex/_generated/api'
import { authClient } from './auth-client'
import { accountCache, anonymousGroups, upsertGroup, type SavedGroup } from './savedGroups'

export type MyGroups =
  | { status: 'loading' }
  | {
      status: 'ready'
      /** anonymous: localStorage only; account: synced; expired: session lost, showing the cached account list. */
      mode: 'anonymous' | 'account' | 'expired'
      groups: SavedGroup[]
    }

/** The user's groups, from the account when logged in, from localStorage otherwise. */
export function useMyGroups() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const remote = useQuery(api.memberships.mine, isAuthenticated ? {} : 'skip')
  const local = anonymousGroups.useValue()
  const cache = accountCache.useValue()
  const saveRemote = useMutation(api.memberships.save)
  const forgetRemote = useMutation(api.memberships.forget)

  let state: MyGroups
  if (isLoading || (isAuthenticated && !remote)) state = { status: 'loading' }
  else if (isAuthenticated && remote) state = { status: 'ready', mode: 'account', groups: remote }
  else if (cache)
    state = {
      status: 'ready',
      mode: 'expired',
      groups: [...local, ...cache.groups.filter((g) => !local.some((l) => l.id === g.id))],
    }
  else state = { status: 'ready', mode: 'anonymous', groups: local }

  async function save(groupId: string, me: string | undefined) {
    if (isAuthenticated) await saveRemote(me ? { groupId, me } : { groupId })
    else anonymousGroups.set(upsertGroup(anonymousGroups.get(), groupId, me))
  }

  async function forget(groupId: string) {
    if (isAuthenticated) return void (await forgetRemote({ groupId }))
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
  const { isAuthenticated } = useConvexAuth()
  const { data: session } = authClient.useSession()
  const remote = useQuery(api.memberships.mine, isAuthenticated ? {} : 'skip')
  const importLocal = useMutation(api.memberships.importLocal)
  const importing = useRef(false)
  const userId = isAuthenticated ? session?.user.id : undefined

  useEffect(() => {
    if (!userId) return
    const cached = accountCache.get()
    if (cached && cached.userId !== userId) accountCache.set(null)

    const local = anonymousGroups.get()
    if (local.length === 0 || importing.current) return
    importing.current = true
    importLocal({ items: local.map((g) => (g.me ? { groupId: g.id, me: g.me } : { groupId: g.id })) })
      .then(() => anonymousGroups.set([]))
      .finally(() => {
        importing.current = false
      })
  }, [userId, importLocal])

  useEffect(() => {
    if (userId && remote) accountCache.set({ userId, groups: remote })
  }, [userId, remote])
}
