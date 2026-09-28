import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { ArrowLeftRight, ArrowRight, Link2, SlidersHorizontal, UtensilsCrossed, Car, ShoppingBasket, Zap } from 'lucide-react'
import { useFormatters } from '../lib/prefs'
import { Avatar } from '../ui/Avatar'
import { SiteFooter } from '../ui/SiteFooter'
import { Wordmark } from '../ui/Wordmark'

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: msg`Every filter, for free`,
    text: msg`By who paid, by who is involved, by category, by text. Combine them, no subscription.`,
  },
  {
    icon: Zap,
    title: msg`Real time`,
    text: msg`An expense added by anyone shows up instantly for the whole group. No more refreshing.`,
  },
  {
    icon: Link2,
    title: msg`No sign-up`,
    text: msg`Create a group, send the link, that's it. No account to create, no app to install.`,
  },
  {
    icon: ArrowLeftRight,
    title: msg`The fewest transfers possible`,
    text: msg`Kwittly works out who owes how much to whom, with the minimum number of repayments.`,
  },
]

const STEPS = [
  { title: msg`Create a group`, text: msg`Give it a name and add the participants.` },
  { title: msg`Share the link`, text: msg`Everyone joins in one tap, from their phone.` },
  { title: msg`Add your expenses`, text: msg`Balances update on their own.` },
]

export function LandingPage() {
  const { i18n } = useLingui()
  return (
    <div className="overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="flex items-center justify-between py-5">
          <Wordmark />
          <div className="flex items-center gap-1">
            <Link to="/login" className="btn-ghost">
              <Trans>Log in</Trans>
            </Link>
            <Link to="/groups/new" className="btn-primary px-4 py-2 text-sm">
              <Trans>Create a group</Trans>
            </Link>
          </div>
        </nav>

        <section className="grid items-center gap-12 pt-10 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
              <span className="size-1.5 rounded-full bg-accent" /> <Trans>Free · No sign-up</Trans>
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <Trans>
                Shared expenses, <span className="text-accent">without the headache.</span>
              </Trans>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              <Trans>
                Trips, flatshares, nights out: note who paid for what, Kwittly handles the rest. And find any expense in
                two clicks.
              </Trans>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/groups/new" className="btn-primary px-6 py-3.5 text-base">
                <Trans>Create a group</Trans> <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-muted">
                <Trans>Ready in 30 seconds.</Trans>
              </span>
            </div>
          </div>
          <AppPreview />
        </section>
      </div>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            <Trans>Everything you need, nothing to pay.</Trans>
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title.id}>
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{i18n._(title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{i18n._(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          <Trans>How it works</Trans>
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title.id} className="card p-6">
              <span className="font-display text-4xl font-bold text-accent/30">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{i18n._(step.title)}</h3>
              <p className="mt-1 text-sm text-muted">{i18n._(step.text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              <Trans>Trip coming up?</Trans>
            </h2>
            <p className="mt-2 text-white/60">
              <Trans>Create the group now, add expenses as you go.</Trans>
            </p>
          </div>
          <Link
            to="/groups/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]"
          >
            <Trans>Create a group</Trans> <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <SiteFooter wide />
    </div>
  )
}

/** Static mock of the group screen, for illustration only. */
function AppPreview() {
  const { i18n } = useLingui()
  const format = useFormatters()
  const expenses = [
    { icon: UtensilsCrossed, tint: 'bg-rose-100 text-rose-800', title: msg`Dinner at Time Out`, who: 'Alice', cents: 9000 },
    { icon: Car, tint: 'bg-sky-100 text-sky-800', title: msg`Airport taxi`, who: 'Bob', cents: 2450 },
    { icon: ShoppingBasket, tint: 'bg-amber-100 text-amber-800', title: msg`Pingo Doce groceries`, who: 'Chloé', cents: 4120 },
  ]
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent-soft blur-2xl" />
      <div className="rotate-1 rounded-[2rem] border border-line bg-canvas p-5 shadow-2xl shadow-ink/10">
        <p className="font-display text-2xl font-semibold">
          <Trans>Lisbon weekend</Trans>
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <span className="flex -space-x-1.5">
            {['Alice', 'Bob', 'Chloé'].map((n) => (
              <Avatar key={n} name={n} size="sm" ring />
            ))}
          </span>
          <Trans>You are Bob</Trans>
        </div>
        <div className="card mt-4 grid grid-cols-2 divide-x divide-line">
          <div className="p-3">
            <p className="label">
              <Trans>Your balance</Trans>
            </p>
            <p className="mt-1 text-xs text-owe">
              <Trans>You owe</Trans>
            </p>
            <p className="font-display text-xl font-semibold text-owe">{format.money(1775, 'EUR')}</p>
          </div>
          <div className="flex flex-col justify-between p-3 text-right">
            <p className="label">
              <Trans>Total</Trans>
            </p>
            <p className="font-display text-xl font-semibold">{format.money(15570, 'EUR')}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 text-xs">
          <span className="chip chip-on py-1">
            <Trans>Involves me</Trans>
          </span>
          <span className="chip py-1">
            <Trans>Paid by</Trans>
          </span>
          <span className="chip py-1">
            <Trans>Category</Trans>
          </span>
        </div>
        <ul className="card mt-3 divide-y divide-line">
          {expenses.map(({ icon: Icon, tint, title, who, cents }) => (
            <li key={title.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className={`flex size-9 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{i18n._(title)}</span>
                <span className="block text-xs text-muted">
                  <Trans>Paid by {who}</Trans>
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{format.money(cents, 'EUR')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
