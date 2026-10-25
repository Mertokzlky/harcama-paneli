import { getCategory } from './categories'
import { formatMonth } from './format'
import type { Transaction } from './types'

export interface Summary {
  income: number
  expense: number
  net: number
}

export function summarize(list: Transaction[]): Summary {
  let income = 0
  let expense = 0
  for (const t of list) {
    if (t.type === 'income') income += t.amountMinor
    else expense += t.amountMinor
  }
  return { income, expense, net: income - expense }
}

export interface CategorySlice {
  id: string
  label: string
  color: string
  value: number
}

export function expenseByCategory(list: Transaction[]): CategorySlice[] {
  const totals = new Map<string, number>()
  for (const t of list) {
    if (t.type !== 'expense') continue
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amountMinor)
  }
  return [...totals.entries()]
    .map(([id, value]) => {
      const c = getCategory(id)
      return { id, label: c.label, color: c.color, value }
    })
    .sort((a, b) => b.value - a.value)
}

export interface MonthPoint {
  month: string
  label: string
  income: number
  expense: number
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Verideki en son aydan geriye `months` aylık seri; boş aylar 0 ile doldurulur. */
export function monthlyTrend(list: Transaction[], months = 6): MonthPoint[] {
  if (list.length === 0) return []
  const totals = new Map<string, { income: number; expense: number }>()
  let latest = ''
  for (const t of list) {
    const ym = t.date.slice(0, 7)
    if (ym > latest) latest = ym
    const cur = totals.get(ym) ?? { income: 0, expense: 0 }
    cur[t.type] += t.amountMinor
    totals.set(ym, cur)
  }
  const points: MonthPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const ym = shiftMonth(latest, -i)
    const v = totals.get(ym) ?? { income: 0, expense: 0 }
    points.push({ month: ym, label: formatMonth(ym), ...v })
  }
  return points
}
