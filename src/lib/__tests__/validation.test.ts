import { describe, expect, test } from 'vitest'
import { expenseSchema } from '../validation'

const valid = { amount: '12,50', categoryId: '3f2b6f1e-1c1a-4a8e-9d43-2b8f1e0c9a11', spentOn: '2026-11-24', note: '' }

describe('expenseSchema', () => {
  test('turns a typed amount into sen and an empty note into null', () => {
    expect(expenseSchema.parse(valid)).toEqual({ amountSen: 1250, categoryId: valid.categoryId, spentOn: '2026-11-24', note: null })
  })
  test('rejects zero amount', () => {
    expect(expenseSchema.safeParse({ ...valid, amount: '0' }).success).toBe(false)
  })
  test('rejects an impossible date', () => {
    expect(expenseSchema.safeParse({ ...valid, spentOn: '2026-13-01' }).success).toBe(false)
    expect(expenseSchema.safeParse({ ...valid, spentOn: '2026-02-30' }).success).toBe(false)
  })
  test('rejects a note over 200 characters', () => {
    expect(expenseSchema.safeParse({ ...valid, note: 'x'.repeat(201) }).success).toBe(false)
  })
  test('rejects a category id that is not a uuid', () => {
    expect(expenseSchema.safeParse({ ...valid, categoryId: '1 or 1=1' }).success).toBe(false)
  })
})
