import { expect, test } from 'vitest'
import { categoryStyle } from '../category-style'

test('the 8 default categories get their own icon and tint', () => {
  expect(categoryStyle('Makan')).toEqual({ icon: '🍛', tint: '#FFE9C7' })
  expect(categoryStyle('Pengangkutan')).toEqual({ icon: '🛵', tint: '#D9ECFF' })
  expect(categoryStyle('Bil & Internet').icon).toBe('📶')
  expect(categoryStyle('Lain-lain').icon).toBe('🧾')
})

test('matching ignores case and surrounding spaces', () => {
  expect(categoryStyle('  makan ').icon).toBe('🍛')
})

test('a custom category gets a tag icon and the same tint every time', () => {
  const a = categoryStyle('Gym')
  expect(a.icon).toBe('🏷️')
  expect(categoryStyle('Gym')).toEqual(a)
  expect(a.tint).toMatch(/^#[0-9A-F]{6}$/)
})
