import { useSyncExternalStore } from 'react'

/** A JSON value in localStorage, observable from React and synced across tabs. */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>()
  let cache: { value: T } | null = null

  function get(): T {
    if (cache) return cache.value
    let value = fallback
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) value = JSON.parse(raw) as T
    } catch {
      // Storage unavailable or corrupted: use the fallback.
    }
    cache = { value }
    return value
  }

  function set(value: T) {
    cache = { value }
    try {
      if (value === fallback) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage unavailable (private mode, quota): keep the in-memory copy.
    }
    listeners.forEach((l) => l())
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      cache = null
      listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  function useValue() {
    return useSyncExternalStore(subscribe, get, () => fallback)
  }

  return { key, get, set, useValue }
}
