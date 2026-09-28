import { describe, expect, test } from 'vitest'
import { parseCents } from './money'

describe('parseCents', () => {
  test('accepts a comma or a dot as decimal separator', () => {
    expect(parseCents('12,50')).toBe(1250)
    expect(parseCents('12.5')).toBe(1250)
    expect(parseCents(' 90 ')).toBe(9000)
  })

  test('rounds to the nearest cent', () => {
    expect(parseCents('0.105')).toBe(11)
    expect(parseCents('19.99')).toBe(1999)
  })

  test('rejects empty, zero, negative and invalid amounts', () => {
    for (const input of ['', '0', '-5', 'abc', '12,50,00']) expect(parseCents(input)).toBeNull()
  })
})
