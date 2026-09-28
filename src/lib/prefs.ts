import { createContext, useContext, useMemo } from 'react'
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '../../convex/lib/locale'

export const TIME_ZONE_COOKIE = 'tz'

/**
 * Language and time zone used for rendering. Resolved once on the server from
 * the request, then read back from the <html> element in the browser, so both
 * sides render the same text and dates.
 */
export type Prefs = { locale: Locale; timeZone: string }

export const PrefsContext = createContext<Prefs>({ locale: DEFAULT_LOCALE, timeZone: 'UTC' })

export function usePrefs() {
  return useContext(PrefsContext)
}

export function isTimeZone(value: string | undefined): value is string {
  if (!value) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

/**
 * Explicit language choice: a cookie for the server, and <html lang>, which the
 * root route reads in the browser (call router.invalidate() afterwards).
 */
export function applyLocaleChoice(locale: Locale) {
  setCookie(LOCALE_COOKIE, locale)
  document.documentElement.lang = locale
}

/** Lets the server render dates in the browser's time zone from the next page load on. */
export function rememberTimeZone(current: string) {
  const actual = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (actual && actual !== current) setCookie(TIME_ZONE_COOKIE, actual)
}

const INTL_LOCALES: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR' }

/** Money and date formatting in the rendering language and time zone. */
export function useFormatters() {
  const { locale, timeZone } = usePrefs()
  return useMemo(() => {
    const intlLocale = INTL_LOCALES[locale]
    const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
    return {
      money: (cents: number, currency: string) =>
        new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(cents / 100),
      date: (timestamp: number, options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(intlLocale, { timeZone, ...options }).format(timestamp),
      /** Calendar day of a timestamp in the rendering time zone, as YYYY-MM-DD. */
      dayKey: (timestamp: number) => dayKey(new Date(timestamp)),
      todayKey: (offsetDays = 0) => dayKey(new Date(Date.now() + offsetDays * 86_400_000)),
    }
  }, [locale, timeZone])
}
