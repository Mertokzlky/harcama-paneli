import { getCategory } from './categories'
import type { Transaction } from './types'

/** Bir gider kategorisi için aylık harcama limiti (her ay geçerli). Tutar kuruş cinsinden. */
export interface Budget {
  categoryId: string
  limitMinor: number
}

export type BudgetStatus = 'ok' | 'warning' | 'over'

export interface BudgetProgress {
  categoryId: string
  label: string
  color: string
  limitMinor: number
  spentMinor: number
  /** Limit − harcama; limit aşıldıysa negatif. */
  remainingMinor: number
  /** Harcama / limit (1 = tam limit). Aşımda 1'den büyük olabilir. */
  ratio: number
  status: BudgetStatus
}

/**
 * Limitin %80'ine ulaşınca uyarı, limiti aşınca "aşıldı".
 * Tam limite eşit harcama henüz aşım sayılmaz. Float hatası olmasın diye tam sayı karşılaştırılır.
 */
export function budgetStatus(spentMinor: number, limitMinor: number): BudgetStatus {
  if (spentMinor > limitMinor) return 'over'
  if (spentMinor * 10 >= limitMinor * 8) return 'warning'
  return 'ok'
}

/** "2026-11" biçiminde ay anahtarı. */
export function monthKey(ref = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Verilen ay için her limitin ilerlemesini hesaplar; en kritik (oranı en yüksek) olan başta.
 * Yalnızca o ayın GİDER işlemleri sayılır. Gelecek tarihli ama aynı aya ait işlemler de dahildir,
 * çünkü planlanmış harcama da bütçeden düşer.
 */
export function budgetProgress(budgets: Budget[], transactions: Transaction[], month: string): BudgetProgress[] {
  const spent = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.date.startsWith(month)) continue
    spent.set(t.category, (spent.get(t.category) ?? 0) + t.amountMinor)
  }

  return budgets
    .filter((b) => b.limitMinor > 0)
    .map((b): BudgetProgress => {
      const spentMinor = spent.get(b.categoryId) ?? 0
      const cat = getCategory(b.categoryId)
      return {
        categoryId: b.categoryId,
        label: cat.label,
        color: cat.color,
        limitMinor: b.limitMinor,
        spentMinor,
        remainingMinor: b.limitMinor - spentMinor,
        ratio: spentMinor / b.limitMinor,
        status: budgetStatus(spentMinor, b.limitMinor),
      }
    })
    .sort((a, b) => b.ratio - a.ratio || a.label.localeCompare(b.label, 'tr'))
}
