import { describe, expect, it } from 'vitest'
import { budgetProgress, budgetStatus, monthKey } from './budgets'
import type { Transaction } from './types'

const tx = (date: string, amountMinor: number, category = 'market', type: Transaction['type'] = 'expense'): Transaction => ({
  id: `${date}-${category}-${amountMinor}-${type}`,
  type,
  amountMinor,
  category,
  date,
  note: '',
})

describe('budgetStatus', () => {
  it.each([
    [0, 'ok'],
    [7999, 'ok'],
    [8000, 'warning'], // tam %80
    [9999, 'warning'],
    [10000, 'warning'], // tam limit henüz aşım değil
    [10001, 'over'],
  ])('limit 10000, harcama %i → %s', (spent, expected) => expect(budgetStatus(spent, 10000)).toBe(expected))

  it('has no floating point surprises on awkward limits', () => {
    // 3 * 0.8 = 2.4000000000000004 olurdu; tam sayı karşılaştırması bunu önler
    expect(budgetStatus(2400, 3000)).toBe('warning')
    expect(budgetStatus(2399, 3000)).toBe('ok')
  })
})

describe('monthKey', () => {
  it('formats with a zero-padded month', () => {
    expect(monthKey(new Date(2026, 10, 15))).toBe('2026-11')
    expect(monthKey(new Date(2027, 0, 1))).toBe('2027-01')
  })
})

describe('budgetProgress', () => {
  const budgets = [
    { categoryId: 'market', limitMinor: 100000 },
    { categoryId: 'yemek', limitMinor: 50000 },
    { categoryId: 'eglence', limitMinor: 20000 },
  ]

  it('counts only expenses of the requested month and category', () => {
    const list = [
      tx('2026-11-02', 30000, 'market'),
      tx('2026-11-20', 20000, 'market'), // gelecek tarihli ama aynı ay: sayılır
      tx('2026-10-31', 99999, 'market'), // geçen ay: sayılmaz
      tx('2026-12-01', 99999, 'market'), // sonraki ay: sayılmaz
      tx('2026-11-05', 88888, 'maas', 'income'), // gelir: sayılmaz
      tx('2026-11-06', 12345, 'ulasim'), // limiti olmayan kategori: yok sayılır
    ]
    const market = budgetProgress(budgets, list, '2026-11').find((p) => p.categoryId === 'market')!
    expect(market.spentMinor).toBe(50000)
    expect(market.remainingMinor).toBe(50000)
    expect(market.ratio).toBe(0.5)
    expect(market.status).toBe('ok')
  })

  it('reports zero spending for categories with no transactions', () => {
    const r = budgetProgress(budgets, [], '2026-11')
    expect(r).toHaveLength(3)
    expect(r.every((p) => p.spentMinor === 0 && p.status === 'ok')).toBe(true)
  })

  it('shows a negative remainder and over status when the limit is exceeded', () => {
    const r = budgetProgress(budgets, [tx('2026-11-03', 25000, 'eglence')], '2026-11')
    const e = r.find((p) => p.categoryId === 'eglence')!
    expect(e.remainingMinor).toBe(-5000)
    expect(e.ratio).toBeCloseTo(1.25)
    expect(e.status).toBe('over')
  })

  it('sorts the most critical budget first', () => {
    const list = [
      tx('2026-11-03', 25000, 'eglence'), // %125
      tx('2026-11-03', 40000, 'yemek'), // %80
      tx('2026-11-03', 10000, 'market'), // %10
    ]
    expect(budgetProgress(budgets, list, '2026-11').map((p) => p.categoryId)).toEqual(['eglence', 'yemek', 'market'])
  })

  it('ignores invalid (non-positive) limits and resolves category labels', () => {
    const r = budgetProgress([{ categoryId: 'market', limitMinor: 0 }, { categoryId: 'yemek', limitMinor: 100 }], [], '2026-11')
    expect(r.map((p) => p.categoryId)).toEqual(['yemek'])
    expect(r[0].label).toBe('Yemek & Kafe')
  })
})
