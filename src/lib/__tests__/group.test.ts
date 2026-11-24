import { expect, test } from 'vitest'
import { groupCategories } from '../group'

const item = (name: string, totalSen: number) => ({ name, totalSen })

test('shows up to 5 categories as they are, largest first', () => {
  expect(groupCategories([item('A', 1), item('B', 5)])).toEqual([item('B', 5), item('A', 1)])
})

test('folds everything after the top 4 into "Lain (n)" when there are 6 or more', () => {
  const six = [item('A', 60), item('B', 50), item('C', 40), item('D', 30), item('E', 20), item('F', 10)]
  expect(groupCategories(six)).toEqual([item('A', 60), item('B', 50), item('C', 40), item('D', 30), item('Lain (2)', 30)])
})
