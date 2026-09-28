import { BedDouble, Car, Ellipsis, ShoppingBasket, Ticket, UtensilsCrossed, type LucideIcon } from 'lucide-react'

export const CATEGORIES: { name: string; icon: LucideIcon; tint: string }[] = [
  { name: 'Courses', icon: ShoppingBasket, tint: 'bg-amber-100 text-amber-800' },
  { name: 'Restaurant', icon: UtensilsCrossed, tint: 'bg-rose-100 text-rose-800' },
  { name: 'Transport', icon: Car, tint: 'bg-sky-100 text-sky-800' },
  { name: 'Logement', icon: BedDouble, tint: 'bg-violet-100 text-violet-800' },
  { name: 'Activités', icon: Ticket, tint: 'bg-emerald-100 text-emerald-800' },
  { name: 'Autre', icon: Ellipsis, tint: 'bg-stone-100 text-stone-700' },
]

export function categoryFor(name: string | undefined) {
  return CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1]
}
