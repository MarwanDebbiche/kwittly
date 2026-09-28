import { useSyncExternalStore } from 'react'

/**
 * Groups the user created or joined, kept in this browser only (no account yet).
 * `me` is the participant id the user identified as in that group, if any.
 */
export type SavedGroup = { id: string; me?: string; addedAt: number }

const KEY = 'splitmate:groups'
const EMPTY: SavedGroup[] = []
const listeners = new Set<() => void>()
let cache: SavedGroup[] | null = null

function read(): SavedGroup[] {
  if (cache) return cache
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    cache = Array.isArray(parsed) ? (parsed as SavedGroup[]) : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(groups: SavedGroup[]) {
  cache = groups
  try {
    localStorage.setItem(KEY, JSON.stringify(groups))
  } catch {
    // Storage unavailable (private mode, quota): keep the in-memory copy.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    cache = null
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSavedGroups() {
  return useSyncExternalStore(subscribe, read)
}

export function useSavedGroup(id: string) {
  return useSavedGroups().find((g) => g.id === id)
}

/** Add the group to the list (or update it) and set who the user is in it. */
export function saveGroup(id: string, me: string | undefined) {
  const groups = read()
  if (groups.some((g) => g.id === id)) {
    write(groups.map((g) => (g.id === id ? { ...g, me } : g)))
  } else {
    write([{ id, me, addedAt: Date.now() }, ...groups])
  }
}

export function forgetGroup(id: string) {
  write(read().filter((g) => g.id !== id))
}
