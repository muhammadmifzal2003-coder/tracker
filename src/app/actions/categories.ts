'use server'

import { revalidatePath } from 'next/cache'
import { addCategoryCore, deleteCategoryCore, moveExpensesCore, type ActionResult } from '@/lib/core'
import { createServerSupabase } from '@/lib/supabase/server'

function refresh() {
  revalidatePath('/')
  revalidatePath('/expenses')
  revalidatePath('/settings')
}

export async function addCategory(name: string): Promise<ActionResult> {
  const r = await addCategoryCore(await createServerSupabase(), name)
  if (r.ok) refresh()
  return r
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const r = await deleteCategoryCore(await createServerSupabase(), id)
  if (r.ok) refresh()
  return r
}

/** Move every expense from one category to another, then delete the old category. */
export async function moveExpensesAndDelete(fromId: string, toId: string): Promise<ActionResult> {
  const sb = await createServerSupabase()
  const moved = await moveExpensesCore(sb, fromId, toId)
  if (!moved.ok) return moved
  const r = await deleteCategoryCore(sb, fromId)
  refresh()
  return r
}
