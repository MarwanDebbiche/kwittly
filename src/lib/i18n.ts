import { setupI18n, type I18n } from '@lingui/core'
import { DEFAULT_LOCALE, type Locale } from '../../convex/lib/locale'
import { messages as en } from '../locales/en/messages.po'
import { messages as fr } from '../locales/fr/messages.po'

// Both catalogs are small: load them eagerly so rendering never waits on a
// catalog, on the server or during hydration.
const messages = { en, fr }

/**
 * One instance per router, so per request on the server: a Worker serves
 * concurrent requests, and a global instance would mix languages between them.
 */
export function createI18n(locale: Locale = DEFAULT_LOCALE): I18n {
  return setupI18n({ locale, messages })
}
