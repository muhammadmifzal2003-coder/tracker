'use client'

import { useActionState } from 'react'
import { signIn, type LoginState } from './actions'

const initial: LoginState = { error: null }

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial)
  return (
    <form action={action} className="indent" style={{ display: 'grid', gap: 16, marginTop: 24, maxWidth: 380 }}>
      <div className="field">
        <label htmlFor="email">E-mel</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Kata laluan</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Sedang log masuk…' : 'Log masuk'}</button>
    </form>
  )
}
