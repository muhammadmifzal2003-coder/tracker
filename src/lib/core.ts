// Data logic shared by the Server Actions and pages. Takes the Supabase client
// as a parameter so it can be tested without a network.
import type { SupabaseClient } from '@supabase/supabase-js'
import { crossedThreshold } from './budget'
import { parseRinggit } from './money'
import { periodRange } from './periods'
import { categoryNameSchema, expenseSchema, firstMessage, idField, type ExpenseInput } from './validation'

export type ActionError = 'auth' | 'validation' | 'in_use' | 'unknown'
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ActionError; message: string }

export type Expense = { id: string; amountSen: number; spentOn: string; note: string | null; categoryId: string; categoryName: string }
export type Category = { id: string; name: string }
export type Dashboard = {
  today: number
  week: number
  month: number
  budgetSen: number | null
  byCategory: { name: string; totalSen: number }[]
  recent: Expense[]
}

export const PAGE_SIZE = 30
const AUTH: ActionResult<never> = { ok: false, error: 'auth', message: 'Sesi tamat. Sila log masuk semula.' }
const UNKNOWN: ActionResult<never> = { ok: false, error: 'unknown', message: 'Tak dapat simpan. Cuba lagi.' }
const IN_USE: ActionResult<never> = { ok: false, error: 'in_use', message: 'Kategori ini masih ada perbelanjaan. Pindahkan dahulu.' }
const invalid = (message: string): ActionResult<never> => ({ ok: false, error: 'validation', message })

type DB = SupabaseClient

async function currentUser(sb: DB): Promise<{ id: string } | null> {
  const { data } = await sb.auth.getUser()
  return data.user ? { id: data.user.id } : null
}

const sum = (rows: { amount_sen: number }[] | null) => (rows ?? []).reduce((t, r) => t + r.amount_sen, 0)

async function monthBudget(sb: DB): Promise<number | null> {
  const { data } = await sb.from('budgets').select('monthly_amount_sen').maybeSingle()
  return (data as { monthly_amount_sen: number } | null)?.monthly_amount_sen ?? null
}

async function spentBetween(sb: DB, from: string, to: string): Promise<number> {
  const { data } = await sb.from('expenses').select('amount_sen').gte('spent_on', from).lte('spent_on', to)
  return sum(data as { amount_sen: number }[] | null)
}

export async function addExpenseCore(sb: DB, input: ExpenseInput, now: Date): Promise<ActionResult<{ crossed: 80 | 100 | null }>> {
  if (!(await currentUser(sb))) return AUTH
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return invalid(firstMessage(parsed.error))
  const e = parsed.data

  const month = periodRange('month', now)
  const inThisMonth = e.spentOn >= month.from && e.spentOn <= month.to
  const before = inThisMonth ? await spentBetween(sb, month.from, month.to) : 0
  const budget = inThisMonth ? await monthBudget(sb) : null

  const { error } = await sb.from('expenses').insert({ category_id: e.categoryId, amount_sen: e.amountSen, spent_on: e.spentOn, note: e.note })
  if (error) return UNKNOWN

  return { ok: true, data: { crossed: inThisMonth ? crossedThreshold(before, before + e.amountSen, budget) : null } }
}

export async function updateExpenseCore(sb: DB, id: string, input: ExpenseInput): Promise<ActionResult> {
  if (!(await currentUser(sb))) return AUTH
  if (!idField.safeParse(id).success) return invalid('Rekod tidak sah.')
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return invalid(firstMessage(parsed.error))
  const e = parsed.data
  const { error } = await sb
    .from('expenses')
    .update({ category_id: e.categoryId, amount_sen: e.amountSen, spent_on: e.spentOn, note: e.note })
    .eq('id', id)
  return error ? UNKNOWN : { ok: true, data: undefined }
}

export async function deleteExpenseCore(sb: DB, id: string): Promise<ActionResult> {
  if (!(await currentUser(sb))) return AUTH
  if (!idField.safeParse(id).success) return invalid('Rekod tidak sah.')
  const { error } = await sb.from('expenses').delete().eq('id', id)
  return error ? UNKNOWN : { ok: true, data: undefined }
}

export async function addCategoryCore(sb: DB, name: string): Promise<ActionResult> {
  if (!(await currentUser(sb))) return AUTH
  const parsed = categoryNameSchema.safeParse(name)
  if (!parsed.success) return invalid(firstMessage(parsed.error))
  const { error } = await sb.from('categories').insert({ name: parsed.data })
  if (error?.code === '23505') return invalid('Kategori ini sudah ada.')
  return error ? UNKNOWN : { ok: true, data: undefined }
}

export async function deleteCategoryCore(sb: DB, id: string): Promise<ActionResult> {
  if (!(await currentUser(sb))) return AUTH
  if (!idField.safeParse(id).success) return invalid('Kategori tidak sah.')
  const { error } = await sb.from('categories').delete().eq('id', id)
  // 23001 = restrict_violation (on delete restrict), 23503 = foreign_key_violation
  if (error?.code === '23001' || error?.code === '23503') return IN_USE
  return error ? UNKNOWN : { ok: true, data: undefined }
}

export async function moveExpensesCore(sb: DB, fromId: string, toId: string): Promise<ActionResult> {
  if (!(await currentUser(sb))) return AUTH
  if (!idField.safeParse(fromId).success || !idField.safeParse(toId).success || fromId === toId) return invalid('Pilih kategori lain.')
  const { error } = await sb.from('expenses').update({ category_id: toId }).eq('category_id', fromId)
  return error ? UNKNOWN : { ok: true, data: undefined }
}

export async function setBudgetCore(sb: DB, amount: string): Promise<ActionResult> {
  const user = await currentUser(sb)
  if (!user) return AUTH
  const r = parseRinggit(amount)
  if (!r.ok) return invalid(r.error)
  const { error } = await sb
    .from('budgets')
    .upsert({ user_id: user.id, monthly_amount_sen: r.sen, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  return error ? UNKNOWN : { ok: true, data: undefined }
}

type ExpenseRow = { id: string; amount_sen: number; spent_on: string; note: string | null; category_id: string; categories: { name: string } | null }
const EXPENSE_COLUMNS = 'id, amount_sen, spent_on, note, category_id, categories(name)'
const toExpense = (r: ExpenseRow): Expense => ({
  id: r.id,
  amountSen: r.amount_sen,
  spentOn: r.spent_on,
  note: r.note,
  categoryId: r.category_id,
  categoryName: r.categories?.name ?? '',
})

/** Returns null when the session has expired. */
export async function getDashboardCore(sb: DB, now: Date): Promise<Dashboard | null> {
  if (!(await currentUser(sb))) return null
  const day = periodRange('day', now)
  const week = periodRange('week', now)
  const month = periodRange('month', now)
  const from = week.from < month.from ? week.from : month.from
  const to = week.to > month.to ? week.to : month.to

  const [spent, budgetSen, totals, recent] = await Promise.all([
    sb.from('expenses').select('amount_sen, spent_on').gte('spent_on', from).lte('spent_on', to),
    monthBudget(sb),
    sb.rpc('expense_totals_by_category', { p_from: month.from, p_to: month.to }),
    sb.from('expenses').select(EXPENSE_COLUMNS).order('spent_on', { ascending: false }).order('created_at', { ascending: false }).limit(5),
  ])

  const rows = (spent.data ?? []) as { amount_sen: number; spent_on: string }[]
  const within = (r: { spent_on: string }, p: { from: string; to: string }) => r.spent_on >= p.from && r.spent_on <= p.to
  return {
    today: sum(rows.filter((r) => within(r, day))),
    week: sum(rows.filter((r) => within(r, week))),
    month: sum(rows.filter((r) => within(r, month))),
    budgetSen,
    byCategory: ((totals.data ?? []) as { name: string; total_sen: number }[]).map((t) => ({ name: t.name, totalSen: Number(t.total_sen) })),
    recent: ((recent.data ?? []) as unknown as ExpenseRow[]).map(toExpense),
  }
}

export async function listExpensesCore(
  sb: DB,
  opts: { month: string; categoryId?: string; offset: number },
): Promise<Expense[] | null> {
  if (!(await currentUser(sb))) return null
  if (!/^\d{4}-\d{2}$/.test(opts.month)) return []
  const [y, m] = opts.month.split('-').map(Number)
  const from = `${opts.month}-01`
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
  let q = sb.from('expenses').select(EXPENSE_COLUMNS).gte('spent_on', from).lte('spent_on', to)
  if (opts.categoryId && idField.safeParse(opts.categoryId).success) q = q.eq('category_id', opts.categoryId)
  const offset = Math.max(0, Math.floor(opts.offset) || 0)
  const { data } = await q
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)
  return ((data ?? []) as unknown as ExpenseRow[]).map(toExpense)
}

export async function listCategoriesCore(sb: DB): Promise<Category[] | null> {
  if (!(await currentUser(sb))) return null
  const { data } = await sb.from('categories').select('id, name').order('created_at').order('name')
  return (data ?? []) as Category[]
}

export async function getBudgetCore(sb: DB): Promise<number | null> {
  return monthBudget(sb)
}
