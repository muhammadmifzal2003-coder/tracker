export type CategoryStyle = { icon: string; tint: string }

const KNOWN: Record<string, CategoryStyle> = {
  makan: { icon: '🍛', tint: '#FFE9C7' },
  pengangkutan: { icon: '🛵', tint: '#D9ECFF' },
  sewa: { icon: '🏠', tint: '#FFDCD6' },
  'bil & internet': { icon: '📶', tint: '#E5DEFF' },
  belajar: { icon: '📚', tint: '#DDF3E4' },
  hiburan: { icon: '🎬', tint: '#FFE0EF' },
  shopping: { icon: '🛍️', tint: '#FFF3B8' },
  'lain-lain': { icon: '🧾', tint: '#E6EAE5' },
}

const TINTS = ['#FFE9C7', '#D9ECFF', '#FFDCD6', '#E5DEFF', '#DDF3E4', '#FFE0EF', '#FFF3B8', '#D4F1F0']

/** Icon and background tint for a category; stable for custom names. */
export function categoryStyle(name: string): CategoryStyle {
  const key = name.trim().toLowerCase()
  if (KNOWN[key]) return KNOWN[key]
  let h = 0
  for (const ch of key) h = (h * 31 + ch.codePointAt(0)!) >>> 0
  return { icon: '🏷️', tint: TINTS[h % TINTS.length] }
}
