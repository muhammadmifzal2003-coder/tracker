import { expect, test } from 'vitest'
import { safeAction } from '../safe-action'

test('passes a normal result through', async () => {
  expect(await safeAction(async () => ({ ok: true as const, data: 1 }))).toEqual({ ok: true, data: 1 })
})

test('a thrown action (network down, redirect, server error) becomes a Malay "unknown" result', async () => {
  const r = await safeAction(async () => { throw new Error('Failed to fetch') })
  expect(r).toEqual({ ok: false, error: 'unknown', message: 'Tak dapat sambung ke pelayan. Semak internet dan cuba lagi.' })
})
