import type { TxType } from './types'

export interface Category {
  id: string
  label: string
  type: TxType
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'market', label: 'Market', type: 'expense', color: '#2F9E8F' },
  { id: 'yemek', label: 'Yemek & Kafe', type: 'expense', color: '#E08A3C' },
  { id: 'ulasim', label: 'Ulaşım', type: 'expense', color: '#4F7CAC' },
  { id: 'fatura', label: 'Fatura', type: 'expense', color: '#8B6FBF' },
  { id: 'kira', label: 'Kira & Yurt', type: 'expense', color: '#C8423F' },
  { id: 'eglence', label: 'Eğlence', type: 'expense', color: '#D4679A' },
  { id: 'saglik', label: 'Sağlık', type: 'expense', color: '#5BA85B' },
  { id: 'egitim', label: 'Eğitim', type: 'expense', color: '#C2A33A' },
  { id: 'alisveris', label: 'Alışveriş', type: 'expense', color: '#7A8C99' },
  { id: 'diger-gider', label: 'Diğer', type: 'expense', color: '#9A8F85' },
  { id: 'maas', label: 'Maaş', type: 'income', color: '#0B7A6B' },
  { id: 'burs', label: 'Burs & Harçlık', type: 'income', color: '#3F9C6B' },
  { id: 'freelance', label: 'Freelance', type: 'income', color: '#2E8BA8' },
  { id: 'diger-gelir', label: 'Diğer gelir', type: 'income', color: '#6F9A8D' },
]

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id: string): Category {
  return BY_ID.get(id) ?? { id, label: id, type: 'expense', color: '#9A8F85' }
}

export function categoriesFor(type: TxType): Category[] {
  return CATEGORIES.filter((c) => c.type === type)
}

export function defaultCategory(type: TxType): string {
  return type === 'income' ? 'maas' : 'market'
}

const norm = (s: string) => s.trim().toLocaleLowerCase('tr')

/** CSV içe aktarımında etiket ya da id ile kategori bulur. */
export function findCategory(raw: string, type: TxType): Category | undefined {
  const key = norm(raw)
  return CATEGORIES.find((c) => c.type === type && (norm(c.label) === key || c.id === key))
}

export function fallbackCategory(type: TxType): string {
  return type === 'income' ? 'diger-gelir' : 'diger-gider'
}
