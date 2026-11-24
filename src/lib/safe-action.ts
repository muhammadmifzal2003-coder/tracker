import type { ActionResult } from './core'

/** Run a Server Action from the browser without letting a network/server failure crash the page. */
export async function safeAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn()
  } catch {
    return { ok: false, error: 'unknown', message: 'Tak dapat sambung ke pelayan. Semak internet dan cuba lagi.' }
  }
}
