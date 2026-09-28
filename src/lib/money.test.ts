import { describe, expect, test } from 'vitest'
import { parseCents, sanitizeAmountInput } from './money'

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

describe('sanitizeAmountInput', () => {
  test('keeps digits and one comma or point, as typed', () => {
    expect(sanitizeAmountInput('12,50')).toBe('12,50')
    expect(sanitizeAmountInput('12.5')).toBe('12.5')
    expect(sanitizeAmountInput('12,')).toBe('12,')
    expect(sanitizeAmountInput(',5')).toBe(',5')
  })

  test('drops letters, spaces, signs and symbols (typing or pasting)', () => {
    expect(sanitizeAmountInput('12a')).toBe('12')
    expect(sanitizeAmountInput('-5')).toBe('5')
    expect(sanitizeAmountInput('1 234,56 €')).toBe('1234,56')
    expect(sanitizeAmountInput('abc')).toBe('')
  })

  test('keeps only the first separator and 2 decimals', () => {
    expect(sanitizeAmountInput('12,50,3')).toBe('12,50')
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23')
    expect(sanitizeAmountInput('9,999')).toBe('9,99')
  })

  test('limits the integer part to 9 digits', () => {
    expect(sanitizeAmountInput('12345678901')).toBe('123456789')
    expect(sanitizeAmountInput('12345678901,5')).toBe('123456789,5')
  })

  test('produces values parseCents understands', () => {
    expect(parseCents(sanitizeAmountInput('1 234,56 €'))).toBe(123456)
  })
})
