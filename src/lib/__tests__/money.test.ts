import { describe, expect, test } from 'vitest'
import { formatRinggit, parseRinggit } from '../money'

describe('parseRinggit', () => {
  test('accepts dot and comma decimals, RM prefix and spaces', () => {
    expect(parseRinggit('12.50')).toEqual({ ok: true, sen: 1250 })
    expect(parseRinggit('12,50')).toEqual({ ok: true, sen: 1250 })
    expect(parseRinggit('RM 7')).toEqual({ ok: true, sen: 700 })
    expect(parseRinggit(' 12.5 ')).toEqual({ ok: true, sen: 1250 })
    expect(parseRinggit('0.10')).toEqual({ ok: true, sen: 10 })
    expect(parseRinggit('1000000')).toEqual({ ok: true, sen: 100000000 })
  })

  test.each(['0', '-5', '12.345', 'abc', '', '1000001', '1.2.3', '.'])('rejects %j with a Malay message', (bad) => {
    const r = parseRinggit(bad)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0)
  })
})

describe('formatRinggit', () => {
  test('formats sen as RM with thousands separator', () => {
    expect(formatRinggit(123450)).toBe('RM1,234.50')
    expect(formatRinggit(5)).toBe('RM0.05')
    expect(formatRinggit(0)).toBe('RM0.00')
  })
})
