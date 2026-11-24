import 'server-only'
import { redirect } from 'next/navigation'
import { getBudgetCore, getDashboardCore, listCategoriesCore, listExpensesCore } from './core'
import { createServerSupabase } from './supabase/server'

function orLogin<T>(value: T | null): T {
  if (value === null) redirect('/login')
  return value
}

export async function getDashboard(now: Date) {
  return orLogin(await getDashboardCore(await createServerSupabase(), now))
}
export async function listExpenses(opts: { month: string; categoryId?: string; offset: number }) {
  return orLogin(await listExpensesCore(await createServerSupabase(), opts))
}
export async function listCategories() {
  return orLogin(await listCategoriesCore(await createServerSupabase()))
}
export async function getBudget() {
  return getBudgetCore(await createServerSupabase())
}
