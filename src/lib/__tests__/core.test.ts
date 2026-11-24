import { describe, expect, test } from 'vitest'
import { fakeSupabase } from '@/test/fake-supabase'
import { addExpenseCore, deleteCategoryCore, setBudgetCore } from '../core'

const CAT = '3f2b6f1e-1c1a-4a8e-9d43-2b8f1e0c9a11'
const NOW = new Date('2026-11-24T04:00:00Z') // 12:00 MYT
const input = (amount: string, spentOn = '2026-11-24') => ({ amount, categoryId: CAT, spentOn, note: '' })

describe('addExpenseCore', () => {
  test('an expired session returns auth and writes nothing', async () => {
    const { client, calls } = fakeSupabase({ user: null })
    const r = await addExpenseCore(client, input('10'), NOW)
    expect(r).toMatchObject({ ok: false, error: 'auth' })
    expect(calls.filter((c) => c.op === 'insert')).toHaveLength(0)
  })

  test('invalid input returns validation and writes nothing', async () => {
    const { client, calls } = fakeSupabase({ user: { id: 'u1' } })
    const r = await addExpenseCore(client, input('-5'), NOW)
    expect(r).toMatchObject({ ok: false, error: 'validation' })
    expect(calls.filter((c) => c.op === 'insert')).toHaveLength(0)
  })

  test('reports crossing 80% when the save takes the month from 7000 to 8500 sen of 10000', async () => {
    const { client, calls } = fakeSupabase({
      user: { id: 'u1' },
      results: {
        'expenses.select': { data: [{ amount_sen: 4000 }, { amount_sen: 3000 }] },
        'budgets.select': { data: { monthly_amount_sen: 10000 } },
      },
    })
    const r = await addExpenseCore(client, input('15'), NOW)
    expect(r).toEqual({ ok: true, data: { crossed: 80 } })
    const insert = calls.find((c) => c.op === 'insert')
    expect(insert?.args[0]).toEqual({ category_id: CAT, amount_sen: 1500, spent_on: '2026-11-24', note: null })
  })

  test('an expense dated in another month never triggers a notice', async () => {
    const { client } = fakeSupabase({
      user: { id: 'u1' },
      results: { 'expenses.select': { data: [{ amount_sen: 9999 }] }, 'budgets.select': { data: { monthly_amount_sen: 10000 } } },
    })
    const r = await addExpenseCore(client, input('500', '2026-10-31'), NOW)
    expect(r).toEqual({ ok: true, data: { crossed: null } })
  })

  test('a database error returns unknown, not a raw message', async () => {
    const { client } = fakeSupabase({ user: { id: 'u1' }, results: { 'expenses.insert': { error: { code: '42501', message: 'new row violates row-level security' } } } })
    const r = await addExpenseCore(client, input('10'), NOW)
    expect(r).toMatchObject({ ok: false, error: 'unknown' })
    if (!r.ok) expect(r.message).not.toMatch(/row-level/)
  })
})

describe('deleteCategoryCore', () => {
  test.each(['23001', '23503'])('a category still in use (%s) returns in_use with a Malay message', async (code) => {
    const { client } = fakeSupabase({ user: { id: 'u1' }, results: { 'categories.delete': { error: { code, message: 'fk' } } } })
    const r = await deleteCategoryCore(client, CAT)
    expect(r).toEqual({ ok: false, error: 'in_use', message: 'Kategori ini masih ada perbelanjaan. Pindahkan dahulu.' })
  })
})

describe('setBudgetCore', () => {
  test('stores the budget in sen for the current user', async () => {
    const { client, calls } = fakeSupabase({ user: { id: 'u1' } })
    const r = await setBudgetCore(client, '900')
    expect(r).toEqual({ ok: true, data: undefined })
    expect(calls.find((c) => c.op === 'upsert')?.args[0]).toMatchObject({ user_id: 'u1', monthly_amount_sen: 90000 })
  })
})
