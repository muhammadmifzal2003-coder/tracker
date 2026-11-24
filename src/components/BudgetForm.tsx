'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { setBudget } from '@/app/actions/budget'

export function BudgetForm({ currentSen }: { currentSen: number | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function submit(form: FormData) {
    start(async () => {
      const r = await setBudget(String(form.get('budget') ?? ''))
      if (!r.ok && r.error === 'auth') router.push('/login')
      setMsg(r.ok ? { ok: true, text: 'Bajet disimpan.' } : { ok: false, text: r.message })
    })
  }

  return (
    <form action={submit} className="indent settings-block">
      <div className="field">
        <label htmlFor="budget">Bajet sebulan (RM)</label>
        <div className="inline">
          <input id="budget" name="budget" inputMode="decimal" required placeholder="900"
            defaultValue={currentSen ? (currentSen / 100).toFixed(2) : ''} />
          <button className="btn" type="submit" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan bajet'}</button>
        </div>
      </div>
      <p aria-live="polite" className={msg?.ok ? 'soft small' : 'error'}>{msg?.text}</p>
    </form>
  )
}
