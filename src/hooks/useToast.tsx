import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
  action?: ToastAction
}

type PushToast = (message: string, kind?: Toast['kind'], action?: ToastAction) => void

const ToastContext = createContext<PushToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback<PushToast>(
    (message, kind = 'success', action) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, kind, action }])
      // Geri al gibi eylem içeren bildirimler daha uzun kalır.
      setTimeout(() => dismiss(id), action ? 8000 : 4000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`rise pointer-events-auto flex max-w-md items-center gap-4 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-lg ${
              t.kind === 'error' ? 'bg-expense text-white' : 'bg-ink text-bg'
            }`}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
                className="shrink-0 rounded px-1 font-bold underline underline-offset-4 hover:opacity-80"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
