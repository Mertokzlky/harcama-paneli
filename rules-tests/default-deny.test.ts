import { assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { describe, it } from 'vitest'
import { asUser, seed, setupRulesTestEnv } from './helpers.ts'

setupRulesTestEnv()

// Kuralların son bloğu her şeyi kapatır: tanımlı olmayan yollara kimse erişemez, sahibi bile.
describe('tanımsız yollar varsayılan olarak kapalı', () => {
  it('kullanıcı kendi kök belgesine (users/{uid}) yazamaz', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice'), { name: 'Alice' }))
  })

  it('kullanıcı kendi ağacında tanımsız bir alt koleksiyona yazamaz', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice/notes/n1'), { text: 'x' }))
  })

  it('kullanıcı kök seviyede yeni bir koleksiyon açamaz', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'public/x'), { a: 1 }))
  })

  it('kullanıcı tanımsız bir yoldaki mevcut belgeyi okuyamaz', async () => {
    await seed('public/x', { a: 1 })
    await assertFails(getDoc(doc(asUser('alice'), 'public/x')))
  })
})
