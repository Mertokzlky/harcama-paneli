import { useState } from 'react'
import type { FormEvent } from 'react'
import { authErrorMessage } from '../../lib/authErrors'
import { useTheme } from '../../hooks/useTheme'
import { authService } from '../../services'
import { isDemoMode } from '../../services/firebase'
import { Button, IconButton, fieldClass } from '../ui/Button'
import { Icon } from '../ui/Icon'

type Mode = 'login' | 'register'

export function AuthPage() {
  const { theme, toggle } = useTheme()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const isRegister = mode === 'register'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (isRegister && password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    setBusy(true)
    try {
      if (isRegister) await authService.signUp(email.trim(), password)
      else await authService.signIn(email.trim(), password)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onReset() {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('Önce e-posta adresini yaz, sonra "Şifremi unuttum"a bas.')
      return
    }
    try {
      await authService.resetPassword(email.trim())
    } catch (err) {
      const msg = authErrorMessage(err)
      // Hesap var/yok bilgisini sızdırmamak için "kullanıcı yok" durumunda da aynı yanıtı veriyoruz.
      if (msg !== 'E-posta veya şifre hatalı.') {
        setError(msg)
        return
      }
    }
    setInfo('Bu adreste bir hesap varsa şifre sıfırlama bağlantısı gönderdik.')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
      <div className="flex justify-end">
        <IconButton label={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'} onClick={toggle}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </IconButton>
      </div>

      <div className="grid flex-1 items-center gap-10 pb-10 md:grid-cols-2">
        <section>
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-brand text-brand-ink">
            <Icon name="wallet" className="size-6" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Paran nereye gidiyor, bir bakışta gör.
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Gelir ve giderlerini kategoriye göre kaydet, aylık trendini grafiklerde izle, verini CSV olarak
            istediğin zaman al.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">{isRegister ? 'Hesap oluştur' : 'Giriş yap'}</h2>

          {isDemoMode && (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
              Demo modu açık: Firebase yok, veriler yalnızca bu tarayıcıda tutulur. Herhangi bir bilgiyle
              devam edebilirsin.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate={isDemoMode}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required={!isDemoMode}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="ornek@mail.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required={!isDemoMode}
                minLength={isRegister ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
              {isRegister && <p className="mt-1.5 text-xs text-muted">En az 6 karakter.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="rounded-lg bg-income/10 px-3 py-2 text-sm font-medium text-income">
                {info}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={busy} className="w-full">
              {busy ? 'Bekleyin…' : isRegister ? 'Hesap oluştur' : 'Giriş yap'}
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? 'login' : 'register')
                setError(null)
                setInfo(null)
              }}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              {isRegister ? 'Zaten hesabım var' : 'Hesap oluştur'}
            </button>
            {!isRegister && (
              <button type="button" onClick={onReset} className="text-muted underline-offset-4 hover:underline">
                Şifremi unuttum
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
