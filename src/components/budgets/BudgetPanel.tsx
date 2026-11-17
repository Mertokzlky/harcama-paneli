import { formatMoney } from '../../lib/format'
import type { BudgetProgress, BudgetStatus } from '../../lib/budgets'
import { Button, IconButton } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Icon } from '../ui/Icon'

interface Props {
  /** Bütçelerin ait olduğu ay: "2026-11". */
  month: string
  progress: BudgetProgress[]
  loading: boolean
  error: string | null
  /** Bütçesi henüz olmayan gider kategorisi var mı? */
  canAdd: boolean
  onAdd: () => void
  onEdit: (categoryId: string) => void
}

const monthLabel = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' })

function labelFor(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return monthLabel.format(new Date(y, m - 1, 1))
}

const BAR: Record<BudgetStatus, string> = { ok: 'bg-income', warning: 'bg-warning', over: 'bg-expense' }
const TEXT: Record<BudgetStatus, string> = { ok: 'text-muted', warning: 'text-warning', over: 'text-expense' }

function statusText(p: BudgetProgress): string {
  if (p.status === 'over') return `Limit ${formatMoney(-p.remainingMinor)} aşıldı`
  if (p.status === 'warning') return `Limitin %${Math.round(p.ratio * 100)}’i doldu · ${formatMoney(p.remainingMinor)} kaldı`
  return `${formatMoney(p.remainingMinor)} kaldı`
}

export function BudgetPanel({ month, progress, loading, error, canAdd, onAdd, onEdit }: Props) {
  return (
    <section aria-labelledby="budget-title" className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="budget-title" className="text-base font-bold">
            Aylık bütçeler
          </h2>
          <p className="text-xs text-muted">{labelFor(month)} · filtrelerden bağımsız</p>
        </div>
        {progress.length > 0 && canAdd && (
          <Button onClick={onAdd}>
            <Icon name="plus" className="size-4" />
            Limit ekle
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
          Bütçeler yüklenemedi. Firestore kurallarının güncel olarak yayınlandığından emin ol. ({error})
        </p>
      ) : loading ? (
        <p className="py-6 text-center text-sm text-muted" role="status">
          Yükleniyor…
        </p>
      ) : progress.length === 0 ? (
        <EmptyState
          compact
          icon="wallet"
          title="Henüz bütçe limiti yok"
          description="Bir kategori için aylık limit koy, harcaman limite yaklaştığında uyarı al."
        >
          <Button variant="primary" onClick={onAdd}>
            <Icon name="plus" className="size-4" />
            Limit ekle
          </Button>
        </EmptyState>
      ) : (
        <ul className="mt-4 space-y-4">
          {progress.map((p) => {
            const percent = Math.min(100, Math.round(p.ratio * 100))
            return (
              <li key={p.categoryId}>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.label}</span>
                  <span className="num shrink-0 text-sm">
                    <span className="font-bold">{formatMoney(p.spentMinor)}</span>
                    <span className="text-muted"> / {formatMoney(p.limitMinor)}</span>
                  </span>
                  <IconButton label={`Limiti düzenle: ${p.label}`} onClick={() => onEdit(p.categoryId)} className="-my-1 -mr-2">
                    <Icon name="edit" className="size-4" />
                  </IconButton>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${p.label} bütçesi`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-valuetext={statusText(p)}
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
                >
                  <div className={`h-full rounded-full ${BAR[p.status]}`} style={{ width: `${percent}%` }} />
                </div>
                <p className={`mt-1 text-xs font-medium ${TEXT[p.status]}`}>{statusText(p)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
