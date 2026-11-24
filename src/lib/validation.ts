import { z } from 'zod'
import { parseRinggit } from './money'

function isRealDate(ymd: string): boolean {
  const d = new Date(`${ymd}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd
}

export const amountField = z.string().transform((value, ctx) => {
  const r = parseRinggit(value)
  if (!r.ok) {
    ctx.addIssue({ code: 'custom', message: r.error })
    return z.NEVER
  }
  return r.sen
})

export const idField = z.uuid({ message: 'Pilihan tidak sah.' })

export const expenseSchema = z
  .object({
    amount: amountField,
    categoryId: idField,
    spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isRealDate, { message: 'Tarikh tidak sah.' }),
    note: z.string().trim().max(200, { message: 'Nota maksimum 200 aksara.' }).optional().default(''),
  })
  .transform(({ amount, categoryId, spentOn, note }) => ({ amountSen: amount, categoryId, spentOn, note: note || null }))

export type ExpenseInput = z.input<typeof expenseSchema>

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Nama kategori diperlukan.' })
  .max(40, { message: 'Nama kategori maksimum 40 aksara.' })

export function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Input tidak sah.'
}
