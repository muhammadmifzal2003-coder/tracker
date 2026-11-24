const PUBLIC_PATHS = new Set(['/login'])

/** Where the middleware should send this request, or null to let it through. */
export function requiredRedirect(pathname: string, isLoggedIn: boolean): string | null {
  const isPublic = PUBLIC_PATHS.has(pathname)
  if (!isLoggedIn && !isPublic) return '/login'
  if (isLoggedIn && isPublic) return '/'
  return null
}
