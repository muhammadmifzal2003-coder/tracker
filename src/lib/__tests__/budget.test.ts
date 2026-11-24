import { describe, expect, test } from 'vitest'
import { budgetStatus, crossedThreshold } from '../budget'

describe('budgetStatus', () => {
  test('no budget set gives level none without dividing by zero', () => {
    expect(budgetStatus(5000, null)).toEqual({ percent: null, level: 'none' })
  })
  test('levels switch at 80% and 100%', () => {
    expect(budgetStatus(7900, 10000)).toEqual({ percent: 79, level: 'ok' })
    expect(budgetStatus(8000, 10000).level).toBe('warn')
    expect(budgetStatus(10000, 10000).level).toBe('over')
    expect(budgetStatus(15000, 10000)).toEqual({ percent: 150, level: 'over' })
  })
})

describe('crossedThreshold', () => {
  test('reports the highest threshold crossed by a save', () => {
    expect(crossedThreshold(7000, 8500, 10000)).toBe(80)
    expect(crossedThreshold(7000, 10500, 10000)).toBe(100)
    expect(crossedThreshold(8500, 10000, 10000)).toBe(100)
  })
  test('returns null when no new threshold is crossed or no budget', () => {
    expect(crossedThreshold(8500, 9000, 10000)).toBeNull()
    expect(crossedThreshold(1, 2, null)).toBeNull()
  })
})
