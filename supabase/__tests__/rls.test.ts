import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'

const dir = path.resolve(__dirname, '..')
const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
let db: PGlite

async function as<T>(user: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${user ?? ''}', false);`)
  try { return await fn() } finally { await db.exec('reset role;') }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(readFileSync(path.join(dir, '__tests__/stub-auth.sql'), 'utf8'))
  await db.exec(readFileSync(path.join(dir, 'migrations/0001_init.sql'), 'utf8'))
  await db.exec(`insert into auth.users values ('${A}'), ('${B}');`)
}, 60_000)

describe('0001_init migration', () => {
  test('RLS is on for all three tables with 12 policies', async () => {
    const { rows } = await db.query<{ n: number }>(readFileSync(path.join(dir, 'checks/0001_rls_check.sql'), 'utf8'))
    expect(rows).toEqual([{ rls_tables: 3, policies: 12 }])
  })

  test('ensure_default_categories seeds the 8 categories once', async () => {
    await as(A, () => db.query('select public.ensure_default_categories()'))
    await as(A, () => db.query('select public.ensure_default_categories()'))
    const { rows } = await as(A, () => db.query<{ name: string }>('select name from categories order by name'))
    expect(rows.map((r) => r.name).sort()).toEqual(
      ['Belajar', 'Bil & Internet', 'Hiburan', 'Lain-lain', 'Makan', 'Pengangkutan', 'Sewa', 'Shopping'].sort(),
    )
  })

  test("user B cannot see or change user A's data", async () => {
    const cat = await as(A, () => db.query<{ id: string }>(`select id from categories where name = 'Makan'`))
    const catId = cat.rows[0].id
    await as(A, () => db.query(`insert into expenses (category_id, amount_sen, spent_on) values ($1, 850, '2026-11-24')`, [catId]))

    const seen = await as(B, () => db.query('select * from expenses'))
    expect(seen.rows).toHaveLength(0)
    const upd = await as(B, () => db.query('update expenses set amount_sen = 1'))
    expect(upd.affectedRows).toBe(0)
    await expect(
      as(B, () => db.query(`insert into expenses (user_id, category_id, amount_sen, spent_on) values ($1, $2, 100, '2026-11-24')`, [A, catId])),
    ).rejects.toThrow()
  })

  test('logged-out visitors are refused outright', async () => {
    await expect(as(null, () => db.query('select * from expenses'))).rejects.toThrow(/permission denied/)
    await expect(as(null, () => db.query('select public.ensure_default_categories()'))).rejects.toThrow(/permission denied/)
  })

  test('a category with expenses cannot be deleted (23001 restrict_violation)', async () => {
    await expect(as(A, () => db.query(`delete from categories where name = 'Makan'`))).rejects.toMatchObject({ code: '23001' })
  })

  test('amount and note limits are enforced by the database', async () => {
    const cat = await as(A, () => db.query<{ id: string }>(`select id from categories where name = 'Sewa'`))
    await expect(as(A, () => db.query(`insert into expenses (category_id, amount_sen, spent_on) values ($1, 0, '2026-11-24')`, [cat.rows[0].id]))).rejects.toThrow()
    await expect(as(A, () => db.query(`insert into expenses (category_id, amount_sen, spent_on, note) values ($1, 1, '2026-11-24', repeat('x', 201))`, [cat.rows[0].id]))).rejects.toThrow()
  })

  test('expense_totals_by_category sums only the caller in the date range', async () => {
    const { rows } = await as(A, () =>
      db.query<{ name: string; total_sen: number }>(`select name, total_sen from public.expense_totals_by_category('2026-11-01', '2026-11-30')`),
    )
    expect(rows).toEqual([{ name: 'Makan', total_sen: 850 }])
    const b = await as(B, () => db.query(`select * from public.expense_totals_by_category('2026-11-01', '2026-11-30')`))
    expect(b.rows).toHaveLength(0)
  })
})
