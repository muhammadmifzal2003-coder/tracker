import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Self-hosted (from @fontsource) so builds need no network and CSP stays 'self'.
const display = localFont({
  src: '../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-display',
  display: 'swap',
})
// One family for the whole app (design A): no slashed zeros in amounts.

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
    <html lang="ms" className={display.variable}>
      <body>{children}</body>
    </html>
  )
}
