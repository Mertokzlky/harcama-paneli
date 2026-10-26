import { sortTransactions } from '../lib/filters'
import { toISO } from '../lib/format'
import type { AppUser, Transaction, TransactionInput } from '../lib/types'
import type { AuthService, TransactionService } from './types'

/**
 * Demo modu (VITE_DEMO_MODE=true): Firebase olmadan, veriler tarayıcıda localStorage'da.
 * Yalnızca geliştirme / ekran görüntüsü içindir; üretimde kullanılmaz.
 */
const USER_KEY = 'harcama-demo-user'
const DATA_KEY = 'harcama-demo-transactions'

const DEMO_USER: AppUser = { uid: 'demo', email: 'demo@harcama.app' }

const authListeners = new Set<(u: AppUser | null) => void>()
const dataListeners = new Set<() => void>()

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const currentUser = (): AppUser | null => read<AppUser | null>(USER_KEY, null)
const emitAuth = () => authListeners.forEach((cb) => cb(currentUser()))
const emitData = () => dataListeners.forEach((cb) => cb())

export const demoAuthService: AuthService = {
  subscribe(cb) {
    authListeners.add(cb)
    queueMicrotask(() => cb(currentUser()))
    return () => authListeners.delete(cb)
  },
  async signIn() {
    localStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER))
    emitAuth()
  },
  async signUp() {
    localStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER))
    emitAuth()
  },
  async signOut() {
    localStorage.removeItem(USER_KEY)
    emitAuth()
  },
  async resetPassword() {},
}

function seed(): Transaction[] {
  const now = new Date()
  const out: Transaction[] = []
  let n = 0
  const push = (monthsAgo: number, day: number, type: Transaction['type'], category: string, amount: number, note: string) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day)
    if (d > now) return
    out.push({ id: `seed-${n++}`, type, category, amountMinor: Math.round(amount * 100), date: toISO(d), note })
  }
  for (let m = 5; m >= 0; m--) {
    push(m, 1, 'income', 'burs', 6000, 'Aylık burs')
    push(m, 5, 'income', 'freelance', 1500 + ((m * 733) % 3000), 'Web sitesi işi')
    push(m, 2, 'expense', 'kira', 4500, 'Yurt ücreti')
    push(m, 8, 'expense', 'fatura', 420 + ((m * 37) % 120), 'İnternet + telefon')
    push(m, 4, 'expense', 'market', 650 + ((m * 91) % 300), 'Haftalık market')
    push(m, 12, 'expense', 'market', 540 + ((m * 53) % 260), 'Market')
    push(m, 20, 'expense', 'market', 480 + ((m * 41) % 200), 'Market')
    push(m, 6, 'expense', 'yemek', 180 + ((m * 29) % 90), 'Kampüs kafe')
    push(m, 15, 'expense', 'yemek', 260 + ((m * 17) % 140), 'Arkadaşlarla yemek')
    push(m, 10, 'expense', 'ulasim', 350 + ((m * 23) % 80), 'İstanbulkart')
    push(m, 18, 'expense', 'eglence', 150 + ((m * 61) % 250), 'Sinema / oyun')
    if (m % 2 === 0) push(m, 22, 'expense', 'egitim', 399, 'Online kurs')
    if (m % 3 === 1) push(m, 25, 'expense', 'alisveris', 900 + ((m * 77) % 500), 'Giyim')
    if (m === 2) push(m, 14, 'expense', 'saglik', 275, 'Eczane')
  }
  return out
}

function load(): Transaction[] {
  const stored = read<Transaction[] | null>(DATA_KEY, null)
  if (stored) return stored
  const initial = seed()
  localStorage.setItem(DATA_KEY, JSON.stringify(initial))
  return initial
}

const save = (list: Transaction[]) => {
  localStorage.setItem(DATA_KEY, JSON.stringify(list))
  emitData()
}

export const demoTransactionService: TransactionService = {
  subscribe(_uid, onData) {
    const push = () => onData(sortTransactions(load()))
    dataListeners.add(push)
    queueMicrotask(push)
    return () => dataListeners.delete(push)
  },
  async add(_uid, input) {
    save([...load(), { ...input, id: crypto.randomUUID() }])
  },
  async update(_uid, id, input) {
    save(load().map((t) => (t.id === id ? { ...input, id } : t)))
  },
  async remove(_uid, id) {
    save(load().filter((t) => t.id !== id))
  },
  async addMany(_uid, inputs: TransactionInput[]) {
    save([...load(), ...inputs.map((i) => ({ ...i, id: crypto.randomUUID() }))])
  },
}
