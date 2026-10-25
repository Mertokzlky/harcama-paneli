import { getCategory } from './categories'
import { toISO } from './format'
import type { Filters, Transaction } from './types'

const lower = (s: string) => s.toLocaleLowerCase('tr')

export function applyFilters(list: Transaction[], f: Filters): Transaction[] {
  const q = lower(f.query.trim())
  return list.filter((t) => {
    if (f.from && t.date < f.from) return false
    if (f.to && t.date > f.to) return false
    if (f.type !== 'all' && t.type !== f.type) return false
    if (f.category !== 'all' && t.category !== f.category) return false
    if (q) {
      const haystack = lower(`${t.note} ${getCategory(t.category).label}`)
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.from || f.to || f.query.trim() || f.category !== 'all' || f.type !== 'all')
}

export type Preset = 'all' | 'this-month' | 'last-3-months'

export function presetRange(preset: Preset, now = new Date()): { from: string; to: string } {
  if (preset === 'all') return { from: '', to: '' }
  if (preset === 'this-month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: toISO(from), to: toISO(to) }
  }
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: toISO(from), to: toISO(to) }
}

export function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : a.date < b.date ? 1 : -1))
}
