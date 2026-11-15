import { describe, expect, it } from 'vitest'
import { compareWithPreviousMonth } from './stats'
import type { Transaction } from './types'

const tx = (date: string, amountMinor: number, type: Transaction['type'] = 'expense'): Transaction => ({
  id: `${date}-${amountMinor}-${type}`,
  type,
  amountMinor,
  category: type === 'income' ? 'maas' : 'market',
  date,
  note: '',
})

describe('compareWithPreviousMonth', () => {
  const ref = new Date(2026, 10, 15) // 15 Kasım 2026

  it('compares month-to-date against the same day range of the previous month', () => {
    const list = [
      tx('2026-11-03', 8000),
      tx('2026-11-15', 2000), // bugün dahil
      tx('2026-11-20', 99999), // gelecek: sayılmaz
      tx('2026-10-05', 10000),
      tx('2026-10-15', 5000), // aynı aralık: sayılır
      tx('2026-10-20', 77777), // geçen ayın 15'inden sonrası: sayılmaz
    ]
    const r = compareWithPreviousMonth(list, ref)!
    expect(r.day).toBe(15)
    expect(r.current.expense).toBe(10000)
    expect(r.previous.expense).toBe(15000)
    expect(r.expenseChangePct).toBe(-33)
  })

  it('compares incomes too', () => {
    const list = [tx('2026-11-01', 6000, 'income'), tx('2026-10-01', 5000, 'income')]
    expect(compareWithPreviousMonth(list, ref)!.incomeChangePct).toBe(20)
  })

  it('clamps the previous month cutoff when it is shorter (31 Mart vs Şubat)', () => {
    const list = [tx('2026-03-31', 1000), tx('2026-02-28', 4000)]
    const r = compareWithPreviousMonth(list, new Date(2026, 2, 31))!
    expect(r.previous.expense).toBe(4000)
  })

  it('handles January by looking at December of the previous year', () => {
    const list = [tx('2027-01-02', 3000), tx('2026-12-01', 6000)]
    const r = compareWithPreviousMonth(list, new Date(2027, 0, 10))!
    expect(r.previous.expense).toBe(6000)
    expect(r.expenseChangePct).toBe(-50)
  })

  it('returns null change when the previous period had no expenses', () => {
    const r = compareWithPreviousMonth([tx('2026-11-02', 5000)], ref)!
    expect(r.expenseChangePct).toBeNull()
  })

  it('returns null when neither month has data in range', () => {
    expect(compareWithPreviousMonth([tx('2026-08-10', 5000)], ref)).toBeNull()
    expect(compareWithPreviousMonth([], ref)).toBeNull()
  })
})
