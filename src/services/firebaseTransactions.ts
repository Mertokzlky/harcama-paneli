import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { sortTransactions } from '../lib/filters'
import type { Transaction, TransactionInput, TxType } from '../lib/types'
import { getDb } from './firebase'
import type { TransactionService } from './types'

// Veri modeli: users/{uid}/transactions/{id}  (erişim kuralları: firestore.rules)
const col = (uid: string) => collection(getDb(), 'users', uid, 'transactions')

const BATCH_LIMIT = 400 // Firestore toplu yazma sınırı 500

function payload(input: TransactionInput) {
  return {
    type: input.type,
    amountMinor: input.amountMinor,
    category: input.category,
    date: input.date,
    note: input.note,
  }
}

export const firebaseTransactionService: TransactionService = {
  subscribe(uid, onData, onError) {
    const q = query(col(uid), orderBy('date', 'desc'))
    return onSnapshot(
      q,
      (snap) => {
        const list: Transaction[] = snap.docs.map((d) => {
          const v = d.data()
          return {
            id: d.id,
            type: v.type as TxType,
            amountMinor: Number(v.amountMinor),
            category: String(v.category),
            date: String(v.date),
            note: String(v.note ?? ''),
          }
        })
        onData(sortTransactions(list))
      },
      (err) => onError(err),
    )
  },

  async add(uid, input) {
    await addDoc(col(uid), { ...payload(input), createdAt: serverTimestamp() })
  },

  async update(uid, id, input) {
    await updateDoc(doc(getDb(), 'users', uid, 'transactions', id), {
      ...payload(input),
      updatedAt: serverTimestamp(),
    })
  },

  async remove(uid, id) {
    await deleteDoc(doc(getDb(), 'users', uid, 'transactions', id))
  },

  async addMany(uid, inputs) {
    const db = getDb()
    for (let i = 0; i < inputs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db)
      for (const input of inputs.slice(i, i + BATCH_LIMIT)) {
        batch.set(doc(col(uid)), { ...payload(input), createdAt: serverTimestamp() })
      }
      await batch.commit()
    }
  },
}
