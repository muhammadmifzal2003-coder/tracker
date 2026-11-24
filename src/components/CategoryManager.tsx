'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addCategory, deleteCategory, moveExpensesAndDelete } from '@/app/actions/categories'
import type { ActionResult, Category } from '@/lib/core'
import { safeAction } from '@/lib/safe-action'

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inUse, setInUse] = useState<Category | null>(null)
  const [target, setTarget] = useState('')
  const [formKey, setFormKey] = useState(0)

  const handle = (r: ActionResult, onOk?: () => void) => {
    if (r.ok) { setError(null); onOk?.(); return }
    if (r.error === 'auth') router.push('/login')
    setError(r.message)
  }

  function add(form: FormData) {
    start(async () => handle(await safeAction(() => addCategory(String(form.get('name') ?? ''))), () => setFormKey((k) => k + 1)))
  }

  function remove(c: Category) {
    if (!confirm(`Padam kategori "${c.name}"?`)) return
    start(async () => {
      const r = await safeAction(() => deleteCategory(c.id))
      if (!r.ok && r.error === 'in_use') {
        setInUse(c)
        setTarget(categories.find((x) => x.id !== c.id)?.id ?? '')
        setError(null)
        return
      }
      handle(r)
    })
  }

  function moveAndDelete() {
    if (!inUse || !target) return
    start(async () => handle(await safeAction(() => moveExpensesAndDelete(inUse.id, target)), () => setInUse(null)))
  }

  return (
    <div className="settings-block">
      <ul className="plain">
        {categories.map((c) => (
          <li key={c.id} className="row">
            <span className="m" />
            <span className="t">{c.name}</span>
            <button className="a btn-link btn-danger small" onClick={() => remove(c)} disabled={pending} aria-label={`Padam kategori ${c.name}`}>
              Padam
            </button>
          </li>
        ))}
      </ul>

      {inUse && (
        <div className="indent move-box" role="alertdialog" aria-labelledby="move-title">
          <p id="move-title" className="notice">
            &ldquo;{inUse.name}&rdquo; masih ada perbelanjaan. Pindahkan ke kategori lain dahulu, kemudian ia akan dipadam.
          </p>
          <div className="field inline">
            <label htmlFor="move-to" className="sr-only">Pindah ke</label>
            <select id="move-to" value={target} onChange={(e) => setTarget(e.target.value)}>
              {categories.filter((c) => c.id !== inUse.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn" onClick={moveAndDelete} disabled={pending || !target}>Pindah &amp; padam</button>
          </div>
          <button className="btn-link small" onClick={() => setInUse(null)}>Batal</button>
        </div>
      )}

      <form key={formKey} action={add} className="indent field inline" style={{ marginTop: 16 }}>
        <label htmlFor="new-cat" className="sr-only">Nama kategori baru</label>
        <input id="new-cat" name="name" maxLength={40} required placeholder="Kategori baru" />
        <button className="btn btn-ghost" type="submit" disabled={pending}>Tambah</button>
      </form>
      <p aria-live="polite" className="error indent" style={{ marginTop: 8 }}>{error}</p>
    </div>
  )
}
