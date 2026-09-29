import { useSyncExternalStore } from 'react'
import { createLocalStore } from './localStore'

/** Chrome's install event (not in the TypeScript DOM types). */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

/**
 * "pending": an expense was just added on this device, time to offer adding
 * Kwittly to the home screen. "done": offered once, never shown on its own again.
 */
export const installOffer = createLocalStore<'pending' | 'done' | null>('kwittly:install-offer', null)

/** Call after adding an expense: the first one on this device queues the offer. */
export function queueInstallOffer() {
  if (installOffer.get() === null) installOffer.set('pending')
}

// Chrome fires this once, early, possibly before any component mounts.
let deferredPrompt: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as InstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((l) => l())
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Running from the home screen rather than in a browser tab. */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  // iPadOS reports itself as a Mac, but has touch.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

/**
 * How Kwittly can be added to the home screen here: Chrome's install prompt,
 * iOS's manual "Add to Home Screen", or not at all (already installed, or an
 * unsupported browser). Null during SSR and hydration.
 */
export function useInstallMethod() {
  const prompt = useSyncExternalStore(
    subscribe,
    () => deferredPrompt,
    () => null,
  )
  const env = useEnvironment()

  if (!env || env.standalone) return null
  const method = prompt ? ('prompt' as const) : env.ios ? ('ios' as const) : null
  if (!method) return null
  return {
    method,
    /** Phones and tablets: the offer after the first expense is only shown there. */
    touch: env.touch,
    async install() {
      if (!prompt) return false
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      deferredPrompt = null
      listeners.forEach((l) => l())
      return outcome === 'accepted'
    },
  }
}

let environment: { standalone: boolean; ios: boolean; touch: boolean } | null = null
const noSubscription = () => () => {}

/** Browser facts, null during SSR and hydration so both render the same. */
function useEnvironment() {
  return useSyncExternalStore(
    noSubscription,
    () => (environment ??= { standalone: isStandalone(), ios: isIos(), touch: window.matchMedia('(pointer: coarse)').matches }),
    () => null,
  )
}

/** Running from the home screen (false during SSR and hydration). */
export function useIsStandalone() {
  return useEnvironment()?.standalone ?? false
}
