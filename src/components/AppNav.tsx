import Link from 'next/link'

const LINKS = [
  { href: '/', label: 'Utama' },
  { href: '/expenses', label: 'Senarai' },
  { href: '/settings', label: 'Tetapan' },
] as const

export function AppNav({ current }: { current: (typeof LINKS)[number]['href'] }) {
  return (
    <nav className="app-nav" aria-label="Menu utama">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.href === current ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
