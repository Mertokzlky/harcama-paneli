import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppUser } from '../lib/types'
import { authService } from '../services'
import { isDemoMode, isFirebaseConfigured } from '../services/firebase'

interface AuthState {
  user: AppUser | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  // Anahtarlar yoksa Firebase başlatılmaz; App kurulum ekranını gösterir.
  const enabled = isDemoMode || isFirebaseConfigured
  const [state, setState] = useState<AuthState>({ user: null, loading: enabled })

  useEffect(() => {
    if (!enabled) return
    return authService.subscribe((user) => setState({ user, loading: false }))
  }, [enabled])

  const value = useMemo(() => state, [state])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
