import { expect, test } from 'vitest'
import { relativeDay } from '../format'

test('today and yesterday are named, other dates are short', () => {
  expect(relativeDay('2026-11-24', '2026-11-24')).toBe('Hari ini')
  expect(relativeDay('2026-11-23', '2026-11-24')).toBe('Semalam')
  expect(relativeDay('2026-11-30', '2026-12-01')).toBe('Semalam')
  expect(relativeDay('2026-11-20', '2026-11-24')).toBe('20 Nov')
  expect(relativeDay('2025-11-20', '2026-11-24')).toBe('20 Nov 2025')
})
