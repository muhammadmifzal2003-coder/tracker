export const MAX_SEN = 100_000_000 // RM1,000,000.00

export type ParseResult = { ok: true; sen: number } | { ok: false; error: string }

/** Parse what a person types ("12,50", "RM 7", " 12.5 ") into integer sen. No float maths. */
export function parseRinggit(input: string): ParseResult {
  const cleaned = input.trim().replace(/^rm\s*/i, '').replace(',', '.')
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned)
  if (!match) return { ok: false, error: 'Masukkan jumlah yang sah, contoh 12.50' }
  const sen = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (sen <= 0) return { ok: false, error: 'Jumlah mesti lebih daripada RM0' }
  if (sen > MAX_SEN) return { ok: false, error: 'Jumlah terlalu besar (maksimum RM1,000,000)' }
  return { ok: true, sen }
}

export function formatRinggit(sen: number): string {
  const ringgit = Math.floor(sen / 100).toLocaleString('en-MY')
  return `RM${ringgit}.${String(sen % 100).padStart(2, '0')}`
}
