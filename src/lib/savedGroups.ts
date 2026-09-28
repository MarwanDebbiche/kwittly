import { createLocalStore } from './localStore'

/**
 * A group the user created or joined. `me` is the participant id the user
 * identified as in that group, if any.
 */
export type SavedGroup = { id: string; me?: string; addedAt: number }

const NO_GROUPS: SavedGroup[] = []

/** Groups saved in this browser while logged out. Imported into the account at login. */
export const anonymousGroups = createLocalStore<SavedGroup[]>('splitmate:groups', NO_GROUPS)

/**
 * Last known copy of the account's groups, so the list stays visible if the
 * session expires. Never merged into another account: dropped when a different
 * user logs in, cleared on explicit logout.
 */
export const accountCache = createLocalStore<{ userId: string; groups: SavedGroup[] } | null>(
  'splitmate:account-cache',
  null,
)

export function upsertGroup(groups: SavedGroup[], id: string, me: string | undefined) {
  return groups.some((g) => g.id === id)
    ? groups.map((g) => (g.id === id ? { ...g, me } : g))
    : [{ id, me, addedAt: Date.now() }, ...groups]
}

export function hasSavedGroups() {
  return anonymousGroups.get().length > 0 || (accountCache.get()?.groups.length ?? 0) > 0
}

export function clearDeviceGroups() {
  anonymousGroups.set(NO_GROUPS)
  accountCache.set(null)
}
