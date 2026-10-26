import type { AppUser, Transaction, TransactionInput } from '../lib/types'

export interface AuthService {
  subscribe(cb: (user: AppUser | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
}

export interface TransactionService {
  subscribe(
    uid: string,
    onData: (list: Transaction[]) => void,
    onError: (err: Error) => void,
  ): () => void
  add(uid: string, input: TransactionInput): Promise<void>
  update(uid: string, id: string, input: TransactionInput): Promise<void>
  remove(uid: string, id: string): Promise<void>
  addMany(uid: string, inputs: TransactionInput[]): Promise<void>
}
