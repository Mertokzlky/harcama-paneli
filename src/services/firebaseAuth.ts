import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'
import type { AuthService } from './types'

export const firebaseAuthService: AuthService = {
  subscribe(cb) {
    return onAuthStateChanged(getFirebaseAuth(), (u) =>
      cb(u ? { uid: u.uid, email: u.email ?? '' } : null),
    )
  },
  async signIn(email, password) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  },
  async signUp(email, password) {
    await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  },
  async signOut() {
    await signOut(getFirebaseAuth())
  },
  async resetPassword(email) {
    await sendPasswordResetEmail(getFirebaseAuth(), email)
  },
}
