import { CATEGORIES, fallbackCategory, findCategory, getCategory } from './categories'
import { isValidISODate, minorToInput, parseAmountToMinor } from './format'
import { MAX_NOTE_LENGTH } from './types'
import type { Transaction, TransactionInput, TxType } from './types'

export const CSV_HEADER = ['Tarih', 'Tür', 'Kategori', 'Tutar', 'Not']
export const MAX_IMPORT_ROWS = 2000

const FORMULA_START = /^[=+\-@\t\r]/

/** CSV/Excel formül enjeksiyonuna karşı: tehlikeli başlangıçlı hücrelerin önüne ' eklenir. */
function sanitizeCell(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value
}

function escapeCell(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Türkçe Excel'in beklediği biçim: ; ayırıcı, UTF-8 BOM, ondalık virgül. */
export function toCsv(list: Transaction[]): string {
  const rows = list.map((t) =>
    [
      t.date,
      t.type === 'income' ? 'Gelir' : 'Gider',
      getCategory(t.category).label,
      minorToInput(t.amountMinor),
      sanitizeCell(t.note),
    ]
      .map(escapeCell)
      .join(';'),
  )
  return '\uFEFF' + [CSV_HEADER.join(';'), ...rows].join('\r\n') + '\r\n'
}

function detectDelimiter(headerLine: string): string {
  const counts = [';', ',', '\t'].map((d) => [d, headerLine.split(d).length - 1] as const)
  return counts.sort((a, b) => b[1] - a[1])[0][0]
}

/** RFC 4180 uyumlu ayrıştırıcı (tırnaklı alanlar, çift tırnak kaçışı, satır içi satır sonu). */
export function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split(/\r\n|\n|\r/, 1)[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

const HEADER_ALIASES: Record<string, string> = {
  tarih: 'date',
  date: 'date',
  tür: 'type',
  tur: 'type',
  type: 'type',
  kategori: 'category',
  category: 'category',
  tutar: 'amount',
  amount: 'amount',
  not: 'note',
  note: 'note',
  açıklama: 'note',
  aciklama: 'note',
}

function normalizeDate(raw: string): string | null {
  const s = raw.trim()
  if (isValidISODate(s)) return s
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s)
  if (!m) return null
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return isValidISODate(iso) ? iso : null
}

function parseType(raw: string): TxType | null {
  const s = raw.trim().toLocaleLowerCase('tr')
  if (s === 'gelir' || s === 'income') return 'income'
  if (s === 'gider' || s === 'expense') return 'expense'
  return null
}

export interface CsvIssue {
  line: number
  message: string
}

export interface CsvParseResult {
  rows: TransactionInput[]
  issues: CsvIssue[]
  totalRows: number
}

export function parseTransactionsCsv(text: string): CsvParseResult {
  const table = parseCsvRows(text)
  const result: CsvParseResult = { rows: [], issues: [], totalRows: 0 }
  if (table.length === 0) {
    result.issues.push({ line: 1, message: 'Dosya boş.' })
    return result
  }

  const columns = new Map<string, number>()
  table[0].forEach((h, i) => {
    const key = HEADER_ALIASES[h.trim().toLocaleLowerCase('tr')]
    if (key && !columns.has(key)) columns.set(key, i)
  })
  const missing = ['date', 'type', 'amount'].filter((k) => !columns.has(k))
  if (missing.length > 0) {
    result.issues.push({
      line: 1,
      message: `Başlık satırı eksik: ${CSV_HEADER.join(', ')} sütunları bekleniyor.`,
    })
    return result
  }

  const body = table.slice(1)
  result.totalRows = body.length
  if (body.length > MAX_IMPORT_ROWS) {
    result.issues.push({ line: 1, message: `En fazla ${MAX_IMPORT_ROWS} satır içe aktarılabilir.` })
    return result
  }

  const get = (cells: string[], key: string) => (cells[columns.get(key) ?? -1] ?? '').trim()

  body.forEach((cells, idx) => {
    const line = idx + 2
    const date = normalizeDate(get(cells, 'date'))
    if (!date) return result.issues.push({ line, message: 'Geçersiz tarih (GG.AA.YYYY veya YYYY-AA-GG).' })
    const type = parseType(get(cells, 'type'))
    if (!type) return result.issues.push({ line, message: 'Tür "Gelir" ya da "Gider" olmalı.' })
    const amountMinor = parseAmountToMinor(get(cells, 'amount'))
    if (amountMinor === null) return result.issues.push({ line, message: 'Geçersiz tutar.' })

    const rawCategory = get(cells, 'category')
    const category = findCategory(rawCategory, type)?.id ?? fallbackCategory(type)
    const note = get(cells, 'note').replace(/^'(?=[=+\-@])/, '').slice(0, MAX_NOTE_LENGTH)
    result.rows.push({ type, amountMinor, category, date, note })
  })
  return result
}

export const KNOWN_CATEGORY_LABELS = CATEGORIES.map((c) => c.label)
