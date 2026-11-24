export type CategoryTotal = { name: string; totalSen: number }
const SHOWN = 4

/** Largest first; with 6+ categories, the tail is folded into "Lain (n)". */
export function groupCategories(items: CategoryTotal[]): CategoryTotal[] {
  const sorted = [...items].sort((a, b) => b.totalSen - a.totalSen)
  if (sorted.length <= SHOWN + 1) return sorted
  const rest = sorted.slice(SHOWN)
  return [...sorted.slice(0, SHOWN), { name: `Lain (${rest.length})`, totalSen: rest.reduce((t, i) => t + i.totalSen, 0) }]
}
