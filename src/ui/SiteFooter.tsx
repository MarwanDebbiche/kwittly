import { Trans } from '@lingui/react/macro'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Wordmark } from './Wordmark'

/** Footer shared by the landing page (wide) and the app pages. */
export function SiteFooter({ wide }: { wide?: boolean }) {
  return (
    <footer className="border-t border-line">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-4 text-sm text-muted ${
          wide ? 'max-w-6xl py-8 sm:px-6' : 'max-w-xl py-6'
        }`}
      >
        <Wordmark className="text-lg" />
        {/* Not enough room next to the switcher in the narrow app column. */}
        {wide && (
          <span className="hidden sm:inline">
            <Trans>Made for groups who like to keep things even.</Trans>
          </span>
        )}
        <LanguageSwitcher />
      </div>
    </footer>
  )
}
