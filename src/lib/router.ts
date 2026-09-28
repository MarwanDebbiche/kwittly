import { useSyncExternalStore } from 'react'

export type Route = { name: 'home' } | { name: 'new' } | { name: 'group'; id: string }

function parse(hash: string): Route {
  if (hash === '#/new') return { name: 'new' }
  const group = hash.match(/^#\/g\/([^/?]+)/)
  if (group) return { name: 'group', id: decodeURIComponent(group[1]) }
  return { name: 'home' }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parse(hash)
}

export function navigate(path: string) {
  window.location.hash = path
}

export function groupShareUrl(groupId: string) {
  return `${window.location.origin}${window.location.pathname}#/g/${groupId}`
}
