import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { BedDouble, Car, Ellipsis, ShoppingBasket, Ticket, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { LEGACY_CATEGORY_KEYS } from '../../convex/lib/categories'

export const CATEGORIES: { key: string; label: MessageDescriptor; icon: LucideIcon; tint: string }[] = [
  { key: 'groceries', label: msg`Groceries`, icon: ShoppingBasket, tint: 'bg-amber-100 text-amber-800' },
  { key: 'restaurant', label: msg`Restaurant`, icon: UtensilsCrossed, tint: 'bg-rose-100 text-rose-800' },
  { key: 'transport', label: msg`Transport`, icon: Car, tint: 'bg-sky-100 text-sky-800' },
  { key: 'lodging', label: msg`Lodging`, icon: BedDouble, tint: 'bg-violet-100 text-violet-800' },
  { key: 'activities', label: msg`Activities`, icon: Ticket, tint: 'bg-emerald-100 text-emerald-800' },
  { key: 'other', label: msg`Other`, icon: Ellipsis, tint: 'bg-stone-100 text-stone-700' },
]

export function categoryFor(value: string | undefined) {
  const key = (value && LEGACY_CATEGORY_KEYS[value]) || value
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]
}
