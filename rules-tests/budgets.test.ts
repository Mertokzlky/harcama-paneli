import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { describe, it } from 'vitest'
import { anonymous, asUser, seed, setupRulesTestEnv } from './helpers.ts'

setupRulesTestEnv()

const PATH = 'users/alice/budgets/market'

const validBudget = (): Record<string, unknown> => ({
  limitMinor: 250_000,
  updatedAt: serverTimestamp(),
})

const seedBudget = () => seed(PATH, { limitMinor: 100_000, updatedAt: Timestamp.fromMillis(1_700_000_000_000) })

describe('bütçeler: sahibi', () => {
  it('limit oluşturabilir', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), PATH), validBudget()))
  })

  it('aynı kategorinin limitini yeniden yazarak güncelleyebilir', async () => {
    await seedBudget()
    await assertSucceeds(setDoc(doc(asUser('alice'), PATH), validBudget()))
  })

  it('limitlerini okuyabilir ve listeleyebilir', async () => {
    await seedBudget()
    const alice = asUser('alice')
    await assertSucceeds(getDoc(doc(alice, PATH)))
    await assertSucceeds(getDocs(collection(alice, 'users/alice/budgets')))
  })

  it('limiti silebilir', async () => {
    await seedBudget()
    await assertSucceeds(deleteDoc(doc(asUser('alice'), PATH)))
  })
})

describe('bütçeler: başka kullanıcılar ve anonim erişim', () => {
  it('başka bir kullanıcı okuyamaz, yazamaz, silemez', async () => {
    await seedBudget()
    const bob = asUser('bob')
    await assertFails(getDoc(doc(bob, PATH)))
    await assertFails(getDocs(collection(bob, 'users/alice/budgets')))
    await assertFails(setDoc(doc(bob, PATH), validBudget()))
    await assertFails(deleteDoc(doc(bob, PATH)))
  })

  it('giriş yapmamış istemci erişemez', async () => {
    await seedBudget()
    const anon = anonymous()
    await assertFails(getDoc(doc(anon, PATH)))
    await assertFails(setDoc(doc(anon, PATH), validBudget()))
  })
})

describe('bütçeler: geçersiz veri yazılamaz', () => {
  const cases: [string, (d: Record<string, unknown>) => Record<string, unknown>][] = [
    ['limit sıfır', (d) => ({ ...d, limitMinor: 0 })],
    ['limit negatif', (d) => ({ ...d, limitMinor: -1 })],
    ['limit ondalıklı', (d) => ({ ...d, limitMinor: 100.5 })],
    ['limit metin', (d) => ({ ...d, limitMinor: '1000' })],
    ['limit üst sınırı aşıyor', (d) => ({ ...d, limitMinor: 100_000_000_000 })],
    ['fazladan bilinmeyen alan', (d) => ({ ...d, note: 'x' })],
    ['updatedAt yok', ({ updatedAt: _updatedAt, ...rest }) => rest],
    ['updatedAt istemci saati (sunucu zamanı değil)', (d) => ({ ...d, updatedAt: Timestamp.now() })],
  ]

  it.each(cases)('%s', async (_name, mutate) => {
    await assertFails(setDoc(doc(asUser('alice'), PATH), mutate(validBudget())))
  })
})

describe('bütçeler: kategori kimliği (belge adı) biçimi', () => {
  it.each([
    ['büyük harf', 'Market'],
    ['boşluk', 'market tr'],
    ['alt çizgi', 'market_tr'],
    ['41 karakter', 'x'.repeat(41)],
  ])('geçersiz: %s', async (_name, id) => {
    await assertFails(setDoc(doc(asUser('alice'), `users/alice/budgets/${id}`), validBudget()))
  })

  it.each([
    ['tireli', 'diger-gider'],
    ['rakam içeren', 'kategori2'],
    ['40 karakter', 'x'.repeat(40)],
  ])('geçerli: %s', async (_name, id) => {
    await assertSucceeds(setDoc(doc(asUser('alice'), `users/alice/budgets/${id}`), validBudget()))
  })
})
