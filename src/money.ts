export function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100)
}

/** Parse "12,50" or "12.5" into integer cents, or null if invalid. */
export function parseCents(input: string): number | null {
  const n = Number(input.replace(',', '.').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}
