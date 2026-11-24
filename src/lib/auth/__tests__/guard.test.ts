import { describe, expect, test } from 'vitest'
import { requiredRedirect } from '../guard'

describe('requiredRedirect', () => {
  test('logged-out visitors are sent to /login from every protected page', () => {
    expect(requiredRedirect('/', false)).toBe('/login')
    expect(requiredRedirect('/expenses', false)).toBe('/login')
    expect(requiredRedirect('/settings', false)).toBe('/login')
  })
  test('the login page is open to logged-out visitors', () => {
    expect(requiredRedirect('/login', false)).toBeNull()
  })
  test('a logged-in owner skips the login page', () => {
    expect(requiredRedirect('/login', true)).toBe('/')
    expect(requiredRedirect('/', true)).toBeNull()
  })
  test('lookalike paths are still protected', () => {
    expect(requiredRedirect('/login-fake', false)).toBe('/login')
    expect(requiredRedirect('/loginx/../', false)).toBe('/login')
  })
})
