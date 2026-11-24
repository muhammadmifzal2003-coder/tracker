import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { requiredRedirect } from '@/lib/auth/guard'
import { supabaseEnv } from '@/lib/supabase/env'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, anonKey } = supabaseEnv()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getUser() validates the token with Supabase; do not trust getSession() here.
  const { data: { user } } = await supabase.auth.getUser()
  const target = requiredRedirect(request.nextUrl.pathname, Boolean(user))
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url))
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
}
