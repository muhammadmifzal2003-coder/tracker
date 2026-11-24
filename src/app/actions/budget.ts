'use server'

import { revalidatePath } from 'next/cache'
import { setBudgetCore, type ActionResult } from '@/lib/core'
import { createServerSupabase } from '@/lib/supabase/server'

export async function setBudget(amount: string): Promise<ActionResult> {
  const r = await setBudgetCore(await createServerSupabase(), amount)
  if (r.ok) {
    revalidatePath('/')
    revalidatePath('/settings')
  }
  return r
}
