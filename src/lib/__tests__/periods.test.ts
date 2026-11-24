import { describe, expect, test } from 'vitest'
import { periodRange, todayKL } from '../periods'

// 2026-11-29 is a Sunday; 15:30Z = 23:30 MYT
describe('KL time zone boundaries', () => {
  test('late night in KL is still today in KL, not the UTC day', () => {
    expect(todayKL(new Date('2026-11-29T15:30:00Z'))).toBe('2026-11-29')
    expect(todayKL(new Date('2026-11-29T16:30:00Z'))).toBe('2026-11-30')
  })

  test('day range is a single KL date', () => {
    expect(periodRange('day', new Date('2026-11-29T15:30:00Z'))).toEqual({ from: '2026-11-29', to: '2026-11-29' })
  })

  test('week runs Monday to Sunday in KL time', () => {
    expect(periodRange('week', new Date('2026-11-29T15:30:00Z'))).toEqual({ from: '2026-11-23', to: '2026-11-29' })
    expect(periodRange('week', new Date('2026-11-29T16:30:00Z'))).toEqual({ from: '2026-11-30', to: '2026-12-06' })
  })

  test('month covers first to last day, including short February and year end', () => {
    expect(periodRange('month', new Date('2026-02-10T00:00:00Z'))).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(periodRange('month', new Date('2026-12-31T16:30:00Z'))).toEqual({ from: '2027-01-01', to: '2027-01-31' })
  })
})
