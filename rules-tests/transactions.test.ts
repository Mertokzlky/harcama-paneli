import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { describe, it } from 'vitest'
import { anonymous, asUser, seed, setupRulesTestEnv } from './helpers.ts'

setupRulesTestEnv()

const PATH = 'users/alice/transactions/t1'

/** Kurallardan geçmesi gereken, geçerli bir işlem belgesi. */
const validTx = (): Record<string, unknown> => ({
  type: 'expense',
  amountMinor: 1250,
  category: 'market',
  date: '2026-11-18',
  note: 'Haftalık market',
  createdAt: serverTimestamp(),
})

/** Sunucuda zaten var olan bir işlem (createdAt sabit bir zaman damgası). */
const seedTx = () =>
  seed(PATH, {
    type: 'expense',
    amountMinor: 1000,
    category: 'market',
    date: '2026-11-01',
    note: '',
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
  })

describe('işlemler: sahibi', () => {
  it('geçerli bir işlem oluşturabilir', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), PATH), validTx()))
  })

  it('kendi işlemini okuyabilir', async () => {
    await seedTx()
    await assertSucceeds(getDoc(doc(asUser('alice'), PATH)))
  })

  it('kendi işlem listesini sorgulayabilir', async () => {
    await seedTx()
    await assertSucceeds(getDocs(collection(asUser('alice'), 'users/alice/transactions')))
  })

  it('createdAt’i değiştirmeden güncelleyebilir', async () => {
    await seedTx()
    await assertSucceeds(updateDoc(doc(asUser('alice'), PATH), { amountMinor: 2000, updatedAt: serverTimestamp() }))
  })

  it('kendi işlemini silebilir', async () => {
    await seedTx()
    await assertSucceeds(deleteDoc(doc(asUser('alice'), PATH)))
  })
})

describe('işlemler: başka kullanıcılar ve anonim erişim', () => {
  it('başka bir kullanıcı işlemi okuyamaz', async () => {
    await seedTx()
    await assertFails(getDoc(doc(asUser('bob'), PATH)))
  })

  it('başka bir kullanıcı işlem listesini sorgulayamaz', async () => {
    await seedTx()
    await assertFails(getDocs(collection(asUser('bob'), 'users/alice/transactions')))
  })

  it('başka bir kullanıcı işlem oluşturamaz, güncelleyemez, silemez', async () => {
    await seedTx()
    const bob = asUser('bob')
    await assertFails(setDoc(doc(bob, 'users/alice/transactions/t2'), validTx()))
    await assertFails(updateDoc(doc(bob, PATH), { amountMinor: 1, updatedAt: serverTimestamp() }))
    await assertFails(deleteDoc(doc(bob, PATH)))
  })

  it('giriş yapmamış istemci okuyamaz ve yazamaz', async () => {
    await seedTx()
    const anon = anonymous()
    await assertFails(getDoc(doc(anon, PATH)))
    await assertFails(setDoc(doc(anon, 'users/alice/transactions/t2'), validTx()))
    await assertFails(deleteDoc(doc(anon, PATH)))
  })
})

describe('işlemler: geçersiz veri oluşturulamaz', () => {
  const cases: [string, (d: Record<string, unknown>) => Record<string, unknown>][] = [
    ['tutar sıfır', (d) => ({ ...d, amountMinor: 0 })],
    ['tutar negatif', (d) => ({ ...d, amountMinor: -5 })],
    ['tutar ondalıklı (kuruş tam sayı olmalı)', (d) => ({ ...d, amountMinor: 12.5 })],
    ['tutar metin', (d) => ({ ...d, amountMinor: '1250' })],
    ['tutar üst sınırı aşıyor', (d) => ({ ...d, amountMinor: 100_000_000_000 })],
    ['tür geçersiz', (d) => ({ ...d, type: 'transfer' })],
    ['tarih biçimi yanlış', (d) => ({ ...d, date: '18.11.2026' })],
    ['tarih metin değil', (d) => ({ ...d, date: 20261118 })],
    ['not 200 karakterden uzun', (d) => ({ ...d, note: 'x'.repeat(201) })],
    ['not alanı yok', ({ note: _note, ...rest }) => rest],
    ['kategori boş', (d) => ({ ...d, category: '' })],
    ['kategori 40 karakterden uzun', (d) => ({ ...d, category: 'x'.repeat(41) })],
    ['fazladan bilinmeyen alan', (d) => ({ ...d, isAdmin: true })],
    ['createdAt yok', ({ createdAt: _createdAt, ...rest }) => rest],
    ['createdAt istemci saati (sunucu zamanı değil)', (d) => ({ ...d, createdAt: Timestamp.now() })],
  ]

  it.each(cases)('%s', async (_name, mutate) => {
    await assertFails(setDoc(doc(asUser('alice'), PATH), mutate(validTx())))
  })

  it('sınır değerleri kabul edilir: azami tutar, 200 karakterlik not, 40 karakterlik kategori', async () => {
    const alice = asUser('alice')
    await assertSucceeds(setDoc(doc(alice, 'users/alice/transactions/max-amount'), { ...validTx(), amountMinor: 99_999_999_999 }))
    await assertSucceeds(setDoc(doc(alice, 'users/alice/transactions/max-note'), { ...validTx(), note: 'x'.repeat(200) }))
    await assertSucceeds(setDoc(doc(alice, 'users/alice/transactions/max-category'), { ...validTx(), category: 'x'.repeat(40) }))
  })
})

describe('işlemler: güncellemede korumalar', () => {
  it('createdAt değiştirilemez', async () => {
    await seedTx()
    await assertFails(updateDoc(doc(asUser('alice'), PATH), { createdAt: Timestamp.fromMillis(1) }))
  })

  it('geçersiz tutarla güncellenemez', async () => {
    await seedTx()
    await assertFails(updateDoc(doc(asUser('alice'), PATH), { amountMinor: 0 }))
  })

  it('bilinmeyen alan eklenemez', async () => {
    await seedTx()
    await assertFails(updateDoc(doc(asUser('alice'), PATH), { isAdmin: true }))
  })
})
