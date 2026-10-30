import { lazy, Suspense } from 'react'
import { AuthPage } from './components/auth/AuthPage'
import { SetupNotice } from './components/auth/SetupNotice'
import { useAuth } from './hooks/useAuth'
import { isDemoMode, isFirebaseConfigured } from './services/firebase'

// Grafik kütüphanesi (Recharts) yalnızca giriş yapıldıktan sonra yüklensin.
const Dashboard = lazy(() =>
  import('./components/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })),
)

const Loading = () => (
  <p className="grid min-h-screen place-items-center text-muted" role="status">
    Yükleniyor…
  </p>
)

export default function App() {
  const { user, loading } = useAuth()

  if (!isDemoMode && !isFirebaseConfigured) return <SetupNotice />
  if (loading) return <Loading />
  return user ? (
    <Suspense fallback={<Loading />}>
      <Dashboard key={user.uid} user={user} />
    </Suspense>
  ) : (
    <AuthPage />
  )
}
