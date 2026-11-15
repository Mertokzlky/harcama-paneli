import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Render sırasında beklenmedik bir hata olursa beyaz ekran yerine anlaşılır bir ekran gösterir.
 * (Asenkron hatalar — ağ, Firestore — burada yakalanmaz; onlar ilgili ekranda ele alınır.)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Beklenmedik arayüz hatası:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold">Bir şeyler ters gitti</h1>
        <p className="mt-3 text-muted">
          Beklenmedik bir hata oluştu. Verilerin güvende. Sayfayı yenilemek genellikle sorunu çözer.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 overflow-auto rounded-lg bg-surface-2 p-3 text-left text-xs">
            {this.state.error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mx-auto mt-6 inline-flex min-h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-ink hover:opacity-90"
        >
          Sayfayı yenile
        </button>
      </main>
    )
  }
}
