const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
const DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
const SHORT = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis']

const parts = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}

/** "November 2026" */
export const monthTitle = (ymd: string) => { const p = parts(ymd); return `${MONTHS[p.m - 1]} ${p.y}` }
/** "Selasa, 24 Nov" */
export const dayLabel = (ymd: string) => { const p = parts(ymd); return `${DAYS[p.dow]}, ${p.d} ${SHORT[p.m - 1]}` }
/** "24/11" for the margin column */
export const marginDate = (ymd: string) => { const p = parts(ymd); return `${p.d}/${p.m}` }
/** Ringgit without the RM prefix, for ledger columns: "1,234.50" */
export const plainAmount = (sen: number) => `${Math.floor(sen / 100).toLocaleString('en-MY')}.${String(sen % 100).padStart(2, '0')}`
