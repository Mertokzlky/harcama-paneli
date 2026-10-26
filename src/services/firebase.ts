import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

/** Zorunlu Firebase değişkenlerinin hepsi dolu mu? */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
)

/** Firebase yalnızca ilk kullanımda (tembel) başlatılır; böylece demo modu ve build anahtar istemez. */
function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(config)
}

export const getFirebaseAuth = () => getAuth(getFirebaseApp())
export const getDb = () => getFirestore(getFirebaseApp())
