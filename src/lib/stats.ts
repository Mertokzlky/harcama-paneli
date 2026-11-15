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

export interface MonthComparison {
  /** Karşılaştırılan gün sayısı: her iki ayın da 1. gününden bu güne kadar. */
  day: number
  current: Summary
  previous: Summary
  /** Gider değişimi yüzde olarak; geçen ay gider yoksa null. */
  expenseChangePct: number | null
  incomeChangePct: number | null
}

const changePct = (cur: number, prev: number): number | null =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null

/**
 * Bu ayın bugüne kadarki toplamını, geçen ayın AYNI GÜN ARALIĞIYLA karşılaştırır.
 * (Ayın 10'unda tüm geçen ayla kıyaslamak yanıltıcı olurdu.) Gelecek tarihli kayıtlar sayılmaz.
 * İki ayda da veri yoksa null döner.
 */
export function compareWithPreviousMonth(list: Transaction[], ref = new Date()): MonthComparison | null {
  const y = ref.getFullYear()
  const m = ref.getMonth() + 1
  const currentMonth = `${y}-${String(m).padStart(2, '0')}`
  const previousMonth = shiftMonth(currentMonth, -1)
  const day = ref.getDate()
  const daysInPrevious = new Date(y, m - 1, 0).getDate()
  const previousCutoff = Math.min(day, daysInPrevious)

  const dayOf = (t: Transaction) => Number(t.date.slice(8, 10))
  const current = list.filter((t) => t.date.startsWith(currentMonth) && dayOf(t) <= day)
  const previous = list.filter((t) => t.date.startsWith(previousMonth) && dayOf(t) <= previousCutoff)
  if (current.length === 0 && previous.length === 0) return null

  const cur = summarize(current)
  const prev = summarize(previous)
  return {
    day,
    current: cur,
    previous: prev,
    expenseChangePct: changePct(cur.expense, prev.expense),
    incomeChangePct: changePct(cur.income, prev.income),
  }
}
