'use server'

import { revalidatePath } from 'next/cache'
import { addExpenseCore, deleteExpenseCore, updateExpenseCore, type ActionResult } from '@/lib/core'
import { createServerSupabase } from '@/lib/supabase/server'
import type { ExpenseInput } from '@/lib/validation'

function refresh() {
  revalidatePath('/')
  revalidatePath('/expenses')
}

export async function addExpense(input: ExpenseInput): Promise<ActionResult<{ crossed: 80 | 100 | null }>> {
  const r = await addExpenseCore(await createServerSupabase(), input, new Date())
  if (r.ok) refresh()
  return r
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<ActionResult> {
  const r = await updateExpenseCore(await createServerSupabase(), id, input)
  if (r.ok) refresh()
  return r
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const r = await deleteExpenseCore(await createServerSupabase(), id)
  if (r.ok) refresh()
  return r
}
