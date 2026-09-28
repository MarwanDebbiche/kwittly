import { useLingui } from '@lingui/react/macro'
import { useRouter } from '@tanstack/react-router'
import type { Locale } from '../../convex/lib/locale'
import { applyLocaleChoice, usePrefs } from '../lib/prefs'

const LABELS: Record<Locale, string> = { en: 'English', fr: 'Français' }

/** Explicit language choice, stored in a cookie so the server renders in it too. */
export function LanguageSwitcher() {
  const { t } = useLingui()
  const { locale } = usePrefs()
  const router = useRouter()

  function choose(next: Locale) {
    if (next === locale) return
    applyLocaleChoice(next)
    void router.invalidate()
  }

  return (
    <div role="group" aria-label={t`Language`} className="inline-flex rounded-full border border-line bg-surface p-0.5 text-xs">
      {(Object.keys(LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => choose(l)}
          aria-pressed={l === locale}
          className={`rounded-full px-3 py-1 transition ${l === locale ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
