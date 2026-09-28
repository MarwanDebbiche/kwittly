import { Link } from '@tanstack/react-router'
import { ArrowLeftRight, ArrowRight, Link2, SlidersHorizontal, UtensilsCrossed, Car, ShoppingBasket, Zap } from 'lucide-react'
import { Avatar } from '../ui/Avatar'

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: 'Tous les filtres, gratuitement',
    text: 'Par personne qui a payé, par participant concerné, par catégorie, par texte. Combinables, sans abonnement.',
  },
  {
    icon: Zap,
    title: 'En temps réel',
    text: "Une dépense ajoutée par quelqu'un apparaît instantanément chez tout le groupe. Plus besoin de rafraîchir.",
  },
  {
    icon: Link2,
    title: 'Sans inscription',
    text: "Crée un groupe, envoie le lien, c'est tout. Ni compte à créer, ni application à installer.",
  },
  {
    icon: ArrowLeftRight,
    title: 'Le moins de virements possible',
    text: 'splitmate calcule qui doit combien à qui, avec le nombre minimal de remboursements.',
  },
]

const STEPS = [
  { title: 'Crée un groupe', text: 'Donne-lui un nom et ajoute les participants.' },
  { title: 'Partage le lien', text: 'Chacun rejoint en un clic, depuis son téléphone.' },
  { title: 'Ajoutez vos dépenses', text: 'Les soldes se mettent à jour tout seuls.' },
]

export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="flex items-center justify-between py-5">
          <Wordmark />
          <Link to="/groups/new" className="btn-primary px-4 py-2 text-sm">
            Créer un groupe
          </Link>
        </nav>

        <section className="grid items-center gap-12 pt-10 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
              <span className="size-1.5 rounded-full bg-accent" /> Gratuit · Sans inscription
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Les comptes entre amis, <span className="text-accent">sans prise de tête.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Voyages, coloc, soirées : note qui a payé quoi, splitmate s'occupe du reste. Et tu retrouves n'importe quelle
              dépense en deux clics.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/groups/new" className="btn-primary px-6 py-3.5 text-base">
                Créer un groupe <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-muted">Prêt en 30 secondes.</span>
            </div>
          </div>
          <AppPreview />
        </section>
      </div>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Tout ce qu'il faut, rien de payant.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Comment ça marche</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card p-6">
              <span className="font-display text-4xl font-bold text-accent/30">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Prochain voyage prévu ?</h2>
            <p className="mt-2 text-white/60">Crée le groupe maintenant, ajoute les dépenses au fil de l'eau.</p>
          </div>
          <Link
            to="/groups/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]"
          >
            Créer un groupe <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted sm:px-6">
          <Wordmark small />
          <span>Fait pour les groupes qui aiment les bons comptes.</span>
        </div>
      </footer>
    </div>
  )
}

function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className={`font-display font-bold tracking-tight text-ink ${small ? 'text-lg' : 'text-2xl'}`}>
      split<span className="text-accent">mate</span>
    </span>
  )
}

/** Static mock of the group screen, for illustration only. */
function AppPreview() {
  const expenses = [
    { icon: UtensilsCrossed, tint: 'bg-rose-100 text-rose-800', title: 'Dîner Time Out', who: 'Alice', amount: '90,00 €' },
    { icon: Car, tint: 'bg-sky-100 text-sky-800', title: 'Taxi aéroport', who: 'Bob', amount: '24,50 €' },
    { icon: ShoppingBasket, tint: 'bg-amber-100 text-amber-800', title: 'Courses Pingo Doce', who: 'Chloé', amount: '41,20 €' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent-soft blur-2xl" />
      <div className="rotate-1 rounded-[2rem] border border-line bg-canvas p-5 shadow-2xl shadow-ink/10">
        <p className="font-display text-2xl font-semibold">Week-end Lisbonne</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <span className="flex -space-x-1.5">
            {['Alice', 'Bob', 'Chloé'].map((n) => (
              <Avatar key={n} name={n} size="sm" ring />
            ))}
          </span>
          Tu es Bob
        </div>
        <div className="card mt-4 grid grid-cols-2 divide-x divide-line">
          <div className="p-3">
            <p className="label">Ton solde</p>
            <p className="mt-1 text-xs text-owe">Tu dois</p>
            <p className="font-display text-xl font-semibold text-owe">17,75 €</p>
          </div>
          <div className="flex flex-col justify-between p-3 text-right">
            <p className="label">Total</p>
            <p className="font-display text-xl font-semibold">155,70 €</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 text-xs">
          <span className="chip chip-on py-1">Me concerne</span>
          <span className="chip py-1">Payé par</span>
          <span className="chip py-1">Catégorie</span>
        </div>
        <ul className="card mt-3 divide-y divide-line">
          {expenses.map(({ icon: Icon, tint, title, who, amount }) => (
            <li key={title} className="flex items-center gap-3 px-3 py-2.5">
              <span className={`flex size-9 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted">Payé par {who}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
