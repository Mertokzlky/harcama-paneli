export type TxType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TxType
  /** Tutar kuruş cinsinden tam sayı (12,50 ₺ → 1250). Float hatalarını önler. */
  amountMinor: number
  category: string
  /** ISO tarih: YYYY-MM-DD (saat dilimi kaymasını önlemek için string tutulur). */
  date: string
  note: string
}

export type TransactionInput = Omit<Transaction, 'id'>

export interface AppUser {
  uid: string
  email: string
}

export interface Filters {
  from: string
  to: string
  category: string
  type: 'all' | TxType
  query: string
}

export const EMPTY_FILTERS: Filters = { from: '', to: '', category: 'all', type: 'all', query: '' }

export const MAX_AMOUNT_MINOR = 99_999_999_999
export const MAX_NOTE_LENGTH = 200
