import type { Metadata, Viewport } from 'next'
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-display' })
const body = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Buku Belanja',
  description: 'Rekod perbelanjaan harian dan kawal bajet bulanan.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F9FC' },
    { media: '(prefers-color-scheme: dark)', color: '#16203A' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
