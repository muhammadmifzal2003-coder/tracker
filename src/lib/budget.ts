export const WARN_AT = 80
export const OVER_AT = 100

export type BudgetLevel = 'none' | 'ok' | 'warn' | 'over'

export function budgetStatus(spentSen: number, budgetSen: number | null): { percent: number | null; level: BudgetLevel } {
  if (!budgetSen || budgetSen <= 0) return { percent: null, level: 'none' }
  const percent = Math.floor((spentSen * 100) / budgetSen)
  const level: BudgetLevel = percent >= OVER_AT ? 'over' : percent >= WARN_AT ? 'warn' : 'ok'
  return { percent, level }
}

/** Which threshold (if any) a save just crossed, so the UI can show a notice once. */
export function crossedThreshold(beforeSen: number, afterSen: number, budgetSen: number | null): 80 | 100 | null {
  if (!budgetSen || budgetSen <= 0) return null
  const before = beforeSen * 100
  const after = afterSen * 100
  if (before < OVER_AT * budgetSen && after >= OVER_AT * budgetSen) return 100
  if (before < WARN_AT * budgetSen && after >= WARN_AT * budgetSen) return 80
  return null
}
