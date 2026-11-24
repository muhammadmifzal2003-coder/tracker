'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'

export type LoginState = { error: string | null }

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
})

const WRONG = 'E-mel atau kata laluan salah.'

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: WRONG }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: WRONG }

  await supabase.rpc('ensure_default_categories')
  redirect('/')
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
