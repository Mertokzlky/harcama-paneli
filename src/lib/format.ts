import { MAX_AMOUNT_MINOR } from './types'

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
const compact = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 })

export function formatMoney(minor: number): string {
  return currency.format(minor / 100)
}

export function formatCompact(minor: number): string {
  return compact.format(minor / 100)
}

/** Formda göstermek için: 123450 → "1234,50" */
export function minorToInput(minor: number): string {
  const whole = Math.floor(minor / 100)
  const frac = String(minor % 100).padStart(2, '0')
  return frac === '00' ? String(whole) : `${whole},${frac}`
}

/**
 * Kullanıcı girdisini kuruşa çevirir. "1.234,56", "1,234.56", "12,5", "₺99" gibi biçimleri anlar.
 * Geçersizse (veya 0 / çok büyükse) null döner. Float aritmetiği kullanılmaz.
 */
export function parseAmountToMinor(raw: string): number | null {
  if (raw.trim().startsWith('-')) return null
  const s = raw.trim().replace(/[^\d.,]/g, '')
  if (!s || !/\d/.test(s)) return null

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  const commaCount = (s.match(/,/g) ?? []).length
  const dotCount = (s.match(/\./g) ?? []).length

  let decimalSep: ',' | '.' | null = null
  if (lastComma > -1 && lastDot > -1) {
    decimalSep = lastComma > lastDot ? ',' : '.'
  } else if (lastComma > -1 || lastDot > -1) {
    const sep = lastComma > -1 ? ',' : '.'
    const count = sep === ',' ? commaCount : dotCount
    const digitsAfter = s.length - 1 - (sep === ',' ? lastComma : lastDot)
    // Tek ayırıcı + tam 3 hane (1.234) ya da tekrar eden ayırıcı → binlik ayırıcı
    decimalSep = count === 1 && digitsAfter !== 3 ? sep : null
  }

  let intPart = s
  let fracPart = ''
  if (decimalSep) {
    const idx = s.lastIndexOf(decimalSep)
    intPart = s.slice(0, idx)
    fracPart = s.slice(idx + 1)
  }
  // Binlik ayırıcılar tutarlı ve 3'lü gruplar halinde olmalı: "1.234.567" geçerli, "1,234,5" değil.
  if (!/^\d+$/.test(intPart) && !/^\d{1,3}([.,]\d{3})+$/.test(intPart)) return null
  if (/\./.test(intPart) && /,/.test(intPart)) return null
  intPart = intPart.replace(/[.,]/g, '')
  if (fracPart.length > 2 || /[.,]/.test(fracPart)) return null
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) return null

  const minor = Number(intPart || '0') * 100 + Number((fracPart + '00').slice(0, 2))
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_AMOUNT_MINOR) return null
  return minor
}

export function todayISO(): string {
  const d = new Date()
  return toISO(d)
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isValidISODate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' })

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFmt.format(new Date(y, m - 1, d))
}

/** "2026-10" → "Eki 26" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return monthFmt.format(new Date(y, m - 1, 1))
}
