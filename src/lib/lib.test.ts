import { describe, expect, it } from 'vitest'
import { parseTransactionsCsv, toCsv } from './csv'
import { applyFilters, presetRange } from './filters'
import { formatMonth, minorToInput, parseAmountToMinor } from './format'
import { expenseByCategory, monthlyTrend, summarize } from './stats'
import { EMPTY_FILTERS } from './types'
import type { Transaction } from './types'

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  type: 'expense',
  amountMinor: 1000,
  category: 'market',
  date: '2026-10-01',
  note: '',
  ...over,
})

describe('parseAmountToMinor', () => {
  it.each([
    ['12,5', 1250],
    ['12.50', 1250],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['1.234', 123400],
    ['₺99', 9900],
    ['1.234.567,89', 123456789],
    ['0,01', 1],
    ['12,345', 1234500], // tek ayırıcı + 3 hane → binlik ayırıcı (Türkçe yazım)
  ])('%s → %i', (input, expected) => expect(parseAmountToMinor(input)).toBe(expected))

  it.each(['', 'abc', '0', '0,00', '-5', '1,234,5', '1.2.3', '99999999999999'])('rejects %j', (input) =>
    expect(parseAmountToMinor(input)).toBeNull(),
  )

  it('round-trips with minorToInput', () => {
    for (const m of [1, 99, 100, 1250, 123456]) expect(parseAmountToMinor(minorToInput(m))).toBe(m)
  })
})

describe('stats', () => {
  const list = [
    tx({ type: 'income', amountMinor: 50000, category: 'maas', date: '2026-09-02' }),
    tx({ amountMinor: 12000, category: 'market', date: '2026-10-03' }),
    tx({ amountMinor: 8000, category: 'market', date: '2026-10-04' }),
    tx({ amountMinor: 5000, category: 'ulasim', date: '2026-10-05' }),
  ]
  it('summarizes', () => expect(summarize(list)).toEqual({ income: 50000, expense: 25000, net: 25000 }))
  it('groups expenses by category, largest first', () => {
    const s = expenseByCategory(list)
    expect(s.map((x) => [x.id, x.value])).toEqual([
      ['market', 20000],
      ['ulasim', 5000],
    ])
  })
  it('builds a gap-filled monthly trend ending at the latest month', () => {
    const t = monthlyTrend(list, 3)
    expect(t.map((p) => p.month)).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(t[0]).toMatchObject({ income: 0, expense: 0 })
    expect(t[1].income).toBe(50000)
    expect(t[2].expense).toBe(25000)
  })
  it('returns empty trend for no data', () => expect(monthlyTrend([])).toEqual([]))
  it('formats month labels in Turkish', () => expect(formatMonth('2026-10')).toMatch(/Eki/))
})

describe('applyFilters', () => {
  const list = [
    tx({ date: '2026-10-01', note: 'Şeker ve süt', category: 'market' }),
    tx({ date: '2026-10-15', note: 'Otobüs', category: 'ulasim' }),
    tx({ date: '2026-11-02', type: 'income', category: 'maas', note: 'Ekim maaşı' }),
  ]
  it('filters by date range (inclusive)', () =>
    expect(applyFilters(list, { ...EMPTY_FILTERS, from: '2026-10-01', to: '2026-10-15' })).toHaveLength(2))
  it('filters by category and type', () => {
    expect(applyFilters(list, { ...EMPTY_FILTERS, category: 'ulasim' })).toHaveLength(1)
    expect(applyFilters(list, { ...EMPTY_FILTERS, type: 'income' })).toHaveLength(1)
  })
  it('searches notes case-insensitively with Turkish locale', () => {
    expect(applyFilters(list, { ...EMPTY_FILTERS, query: 'ŞEKER' })).toHaveLength(1)
    expect(applyFilters(list, { ...EMPTY_FILTERS, query: 'maaş' })).toHaveLength(1)
  })
  it('computes the this-month preset', () =>
    expect(presetRange('this-month', new Date(2026, 1, 10))).toEqual({ from: '2026-02-01', to: '2026-02-28' }))
})

describe('csv', () => {
  it('round-trips through export and import', () => {
    const list = [
      tx({ date: '2026-10-01', amountMinor: 123456, note: 'Market; "indirim" günü' }),
      tx({ date: '2026-10-02', type: 'income', category: 'maas', amountMinor: 5000000, note: '' }),
    ]
    const parsed = parseTransactionsCsv(toCsv(list))
    expect(parsed.issues).toEqual([])
    expect(parsed.rows).toEqual(list.map(({ id: _id, ...rest }) => rest))
  })

  it('neutralises spreadsheet formulas on export and restores them on import', () => {
    const csv = toCsv([tx({ note: '=HYPERLINK("http://evil")' })])
    expect(csv).toContain("'=HYPERLINK")
    expect(parseTransactionsCsv(csv).rows[0].note).toBe('=HYPERLINK("http://evil")')
  })

  it('accepts comma delimiter, DD.MM.YYYY dates and unknown categories', () => {
    const text = 'date,type,category,amount,note\n05.10.2026,expense,Bilinmeyen,"1.234,50",test'
    const parsed = parseTransactionsCsv(text)
    expect(parsed.issues).toEqual([])
    expect(parsed.rows[0]).toMatchObject({ date: '2026-10-05', category: 'diger-gider', amountMinor: 123450 })
  })

  it('reports row-level issues with line numbers', () => {
    const text = 'Tarih;Tür;Kategori;Tutar;Not\n2026-13-40;Gider;Market;10;x\n2026-10-01;Belki;Market;10;x\n2026-10-01;Gider;Market;abc;x\n2026-10-01;Gider;Market;10;ok'
    const parsed = parseTransactionsCsv(text)
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.issues.map((i) => i.line)).toEqual([2, 3, 4])
  })

  it('rejects files without the expected header', () =>
    expect(parseTransactionsCsv('a;b\n1;2').issues[0].message).toMatch(/Başlık/))
})
