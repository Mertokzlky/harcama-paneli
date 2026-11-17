import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import type { Budget } from '../lib/budgets'
import { getDb } from './firebase'
import type { BudgetService } from './types'

// Veri modeli: users/{uid}/budgets/{categoryId}  →  { limitMinor, updatedAt }
// Belge kimliği kategori kimliğidir; böylece kategori başına tek limit olması yapısal olarak garanti.
const col = (uid: string) => collection(getDb(), 'users', uid, 'budgets')

export const firebaseBudgetService: BudgetService = {
  subscribe(uid, onData, onError) {
    return onSnapshot(
      col(uid),
      (snap) => {
        const list: Budget[] = snap.docs
          .map((d) => ({ categoryId: d.id, limitMinor: Number(d.data().limitMinor) }))
          .filter((b) => Number.isSafeInteger(b.limitMinor) && b.limitMinor > 0)
        onData(list)
      },
      (err) => onError(err),
    )
  },

  async set(uid, categoryId, limitMinor) {
    await setDoc(doc(getDb(), 'users', uid, 'budgets', categoryId), {
      limitMinor,
      updatedAt: serverTimestamp(),
    })
  },

  async remove(uid, categoryId) {
    await deleteDoc(doc(getDb(), 'users', uid, 'budgets', categoryId))
  },
}
