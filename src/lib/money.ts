/** Parse "12,50" or "12.5" into integer cents, or null if invalid. */
export function parseCents(input: string): number | null {
  const n = Number(input.replace(',', '.').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

const MAX_INTEGER_DIGITS = 9

/**
 * Keeps what can be typed in an amount field: digits, a single decimal
 * separator (comma or point, as typed) and at most 2 decimals. Anything else
 * is dropped, including when pasting ("1 234,56 €" becomes "1234,56").
 */
export function sanitizeAmountInput(input: string): string {
  const cleaned = input.replace(/[^\d.,]/g, '')
  const separatorIndex = cleaned.search(/[.,]/)
  if (separatorIndex === -1) return cleaned.slice(0, MAX_INTEGER_DIGITS)
  const integer = cleaned.slice(0, separatorIndex).slice(0, MAX_INTEGER_DIGITS)
  const decimals = cleaned
    .slice(separatorIndex + 1)
    .replace(/[.,]/g, '')
    .slice(0, 2)
  return `${integer}${cleaned[separatorIndex]}${decimals}`
}
