'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { addExpense, deleteExpense, updateExpense } from '@/app/actions/expenses'
import type { Category, Expense } from '@/lib/core'
import { todayKL } from '@/lib/periods'
import { safeAction } from '@/lib/safe-action'

type Props = {
  categories: Category[]
  /** When given, the sheet edits this expense instead of adding one. */
  expense?: Expense
  trigger: React.ReactNode
  triggerClassName?: string
  triggerLabel?: string
}

const NOTICE = {
  80: { text: 'Disimpan. Anda dah guna 80% bajet bulan ini.', cls: '' },
  100: { text: 'Disimpan. Bajet bulan ini dah habis.', cls: 'over' },
} as const

export function ExpenseSheet({ categories, expense, trigger, triggerClassName, triggerLabel }: Props) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<(typeof NOTICE)[80 | 100] | null>(null)
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '')
  const [formKey, setFormKey] = useState(0)

  const open = () => {
    setError(null)
    setNotice(null)
    setCategoryId(expense?.categoryId ?? '')
    setFormKey((k) => k + 1)
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()
  useEffect(() => { if (formKey) amountRef.current?.focus() }, [formKey])

  function submit(form: FormData) {
    setError(null)
    if (!categoryId) { setError('Pilih kategori.'); return }
    const input = {
      amount: String(form.get('amount') ?? ''),
      categoryId,
      spentOn: String(form.get('spentOn') ?? ''),
      note: String(form.get('note') ?? ''),
    }
    start(async () => {
      const r = await safeAction<{ crossed: 80 | 100 | null } | void>(() => (expense ? updateExpense(expense.id, input) : addExpense(input)))
      if (!r.ok) {
        if (r.error === 'auth') router.push('/login')
        setError(r.message)
        return
      }
      const crossed = !expense && r.data ? r.data.crossed : null
      if (crossed) {
        setNotice(NOTICE[crossed])
        setCategoryId('')
        setFormKey((k) => k + 1)
      } else {
        close()
      }
    })
  }

  function remove() {
    if (!expense || !confirm('Padam belanja ini?')) return
    start(async () => {
      const r = await safeAction(() => deleteExpense(expense.id))
      if (!r.ok) {
        if (r.error === 'auth') router.push('/login')
        setError(r.message)
        return
      }
      close()
    })
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={open} aria-label={triggerLabel}>{trigger}</button>
      <dialog ref={dialog} className="sheet" aria-labelledby={`sheet-title-${expense?.id ?? 'new'}`}>
        <form key={formKey} action={submit}>
          <div className="grab" aria-hidden />
          <div className="sheet-head">
            <h2 id={`sheet-title-${expense?.id ?? 'new'}`}>{expense ? 'Ubah belanja' : 'Tambah belanja'}</h2>
            <button type="button" className="btn-link" onClick={close}>Tutup</button>
          </div>

          <label className="amount">
            <span aria-hidden>RM</span>
            <input
              ref={amountRef}
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              aria-label="Jumlah (RM)"
              defaultValue={expense ? (expense.amountSen / 100).toFixed(2) : ''}
              required
            />
          </label>

          <fieldset className="chips">
            <legend className="sr-only">Kategori</legend>
            {categories.map((c) => (
              <button type="button" key={c.id} aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.name}
              </button>
            ))}
          </fieldset>

          <div className="fields">
            <div className="field">
              <label htmlFor={`d-${formKey}`}>Tarikh</label>
              <input id={`d-${formKey}`} name="spentOn" type="date" required defaultValue={expense?.spentOn ?? todayKL(new Date())} />
            </div>
            <div className="field">
              <label htmlFor={`n-${formKey}`}>Nota (pilihan)</label>
              <input id={`n-${formKey}`} name="note" maxLength={200} defaultValue={expense?.note ?? ''} />
            </div>
          </div>

          <div aria-live="polite">
            {notice && <p className={`notice ${notice.cls}`} style={{ marginTop: 16 }}>{notice.text}</p>}
            {error && <p className="error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          </div>

          <button className="btn save" type="submit" disabled={pending}>
            {pending ? 'Sedang simpan…' : expense ? 'Simpan perubahan' : 'Simpan belanja'}
          </button>
          {expense && (
            <button type="button" className="btn-link btn-danger" style={{ marginTop: 14 }} onClick={remove} disabled={pending}>
              Padam belanja ini
            </button>
          )}
        </form>
      </dialog>
    </>
  )
}
