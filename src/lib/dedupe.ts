import type { Transaction, TransactionInput } from './types'

type Comparable = Pick<Transaction, 'date' | 'type' | 'category' | 'amountMinor' | 'note'>

/** İki işlemin "aynı" sayılması için kullanılan anahtar: tarih, tür, kategori, tutar ve not. */
function keyOf(t: Comparable): string {
  return [t.date, t.type, t.category, t.amountMinor, t.note.trim().toLocaleLowerCase('tr')].join('|')
}

export interface DedupeResult {
  /** Henüz kayıtlı olmayan, içe aktarılacak satırlar. */
  fresh: TransactionInput[]
  /** Aynısı zaten kayıtlı olduğu için atlanacak satırlar. */
  duplicates: TransactionInput[]
}

/**
 * İçe aktarılacak satırları, mevcut kayıtlarla karşılaştırır.
 *
 * Eşleşme adet bazlıdır: mevcut kayıtlarda bir satırdan 1 tane varsa, dosyadaki aynı satırın yalnızca
 * ilki tekrar sayılır. Böylece aynı gün iki kez alınan aynı kahve gibi gerçek çift kayıtlar kaybolmaz,
 * aynı dosyayı ikinci kez içe aktarmak ise hiçbir şey eklemez.
 */
export function splitDuplicates(rows: TransactionInput[], existing: Comparable[]): DedupeResult {
  const available = new Map<string, number>()
  for (const t of existing) {
    const k = keyOf(t)
    available.set(k, (available.get(k) ?? 0) + 1)
  }

  const result: DedupeResult = { fresh: [], duplicates: [] }
  for (const row of rows) {
    const k = keyOf(row)
    const left = available.get(k) ?? 0
    if (left > 0) {
      available.set(k, left - 1)
      result.duplicates.push(row)
    } else {
      result.fresh.push(row)
    }
  }
  return result
}
