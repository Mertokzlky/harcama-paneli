import { describe, expect, it } from 'vitest'
import { parseTransactionsCsv, toCsv } from './csv'
import { splitDuplicates } from './dedupe'
import type { Transaction, TransactionInput } from './types'

const row = (over: Partial<TransactionInput> = {}): TransactionInput => ({
  type: 'expense',
  amountMinor: 24990,
  category: 'market',
  date: '2026-11-02',
  note: 'Haftalık market',
  ...over,
})

const tx = (over: Partial<Transaction> = {}): Transaction => ({ id: 'a', ...row(), ...over })

describe('splitDuplicates', () => {
  it('mevcut kayıt yoksa hepsi yenidir', () => {
    const r = splitDuplicates([row(), row({ note: 'Başka' })], [])
    expect(r.fresh).toHaveLength(2)
    expect(r.duplicates).toHaveLength(0)
  })

  it('aynı tarih, tür, kategori, tutar ve not tekrar sayılır', () => {
    const r = splitDuplicates([row()], [tx()])
    expect(r.fresh).toHaveLength(0)
    expect(r.duplicates).toHaveLength(1)
  })

  it('not büyük/küçük harf ve baştaki/sondaki boşluktan etkilenmez', () => {
    const r = splitDuplicates([row({ note: '  HAFTALIK MARKET ' })], [tx()])
    expect(r.duplicates).toHaveLength(1)
  })

  it('alanlardan biri farklıysa tekrar sayılmaz', () => {
    const existing = [tx()]
    expect(splitDuplicates([row({ date: '2026-11-03' })], existing).fresh).toHaveLength(1)
    expect(splitDuplicates([row({ amountMinor: 24991 })], existing).fresh).toHaveLength(1)
    expect(splitDuplicates([row({ category: 'yemek' })], existing).fresh).toHaveLength(1)
    expect(splitDuplicates([row({ type: 'income' })], existing).fresh).toHaveLength(1)
    expect(splitDuplicates([row({ note: 'Market' })], existing).fresh).toHaveLength(1)
  })

  it('adet bazlı eşleşir: dosyadaki fazladan aynı satır yeni sayılır', () => {
    const r = splitDuplicates([row(), row(), row()], [tx()])
    expect(r.duplicates).toHaveLength(1)
    expect(r.fresh).toHaveLength(2)
  })

  it('mevcut kayıtta iki tane varsa dosyadaki iki satır da tekrar sayılır', () => {
    const r = splitDuplicates([row(), row()], [tx({ id: 'a' }), tx({ id: 'b' })])
    expect(r.duplicates).toHaveLength(2)
    expect(r.fresh).toHaveLength(0)
  })

  it('girdi dizilerini değiştirmez', () => {
    const rows = [row()]
    const existing = [tx()]
    splitDuplicates(rows, existing)
    expect(rows).toHaveLength(1)
    expect(existing).toHaveLength(1)
  })

  it('kendi dışa aktarımını geri yüklemek hiçbir şey eklemez', () => {
    const existing = [
      tx({ id: '1' }),
      tx({ id: '2', note: 'Kahve', amountMinor: 9000, category: 'yemek' }),
      tx({ id: '3', note: 'Kahve', amountMinor: 9000, category: 'yemek' }),
      tx({ id: '4', type: 'income', category: 'burs', amountMinor: 600000, note: '=SUM(A1)' }),
    ]
    const parsed = parseTransactionsCsv(toCsv(existing))
    const r = splitDuplicates(parsed.rows, existing)
    expect(r.fresh).toHaveLength(0)
    expect(r.duplicates).toHaveLength(4)
  })
})
