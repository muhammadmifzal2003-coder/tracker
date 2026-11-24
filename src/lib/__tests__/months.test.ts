import { expect, test } from 'vitest'
import { normaliseMonth, shiftMonth } from '../months'

test('shiftMonth crosses year boundaries both ways', () => {
  expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  expect(shiftMonth('2026-11', 0)).toBe('2026-11')
})

test('normaliseMonth falls back to the current KL month for missing or bad input', () => {
  const now = new Date('2026-11-30T16:30:00Z') // 1 Dec 00:30 MYT
  expect(normaliseMonth(undefined, now)).toBe('2026-12')
  expect(normaliseMonth('2026-13', now)).toBe('2026-12')
  expect(normaliseMonth("2026-01' or 1=1", now)).toBe('2026-12')
  expect(normaliseMonth('2025-07', now)).toBe('2025-07')
})
