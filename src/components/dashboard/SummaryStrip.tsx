import { formatMoney } from '../../lib/format'
import type { Summary } from '../../lib/stats'

interface Props {
  /** Tüm zamanların bakiyesi (filtreden bağımsız). */
  balance: number
  /** Seçili dönemin (filtreye uyan) toplamları. */
  period: Summary
  periodLabel: string
}

export function SummaryStrip({ balance, period, periodLabel }: Props) {
  const total = period.income + period.expense
  const incomeShare = total === 0 ? 0 : (period.income / total) * 100

  return (
    <section aria-label="Özet" className="rounded-2xl border border-line bg-surface">
      <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <p className="text-sm font-semibold text-muted">Toplam bakiye</p>
          <p
            className={`num mt-1 text-3xl font-extrabold tracking-tight ${balance < 0 ? 'text-expense' : ''}`}
            data-testid="balance"
          >
            {formatMoney(balance)}
          </p>
          <p className="mt-1 text-xs text-muted">Tüm zamanlar</p>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold text-muted">Gelir</p>
          <p className="num mt-1 text-2xl font-bold text-income">{formatMoney(period.income)}</p>
          <p className="mt-1 text-xs text-muted">{periodLabel}</p>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold text-muted">Gider</p>
          <p className="num mt-1 text-2xl font-bold text-expense">{formatMoney(period.expense)}</p>
          <p className="mt-1 text-xs text-muted">{periodLabel}</p>
        </div>
      </div>

      {/* Gelirin ne kadarının harcandığını gösteren oran çubuğu */}
      <div
        className="flex h-2 overflow-hidden rounded-b-2xl bg-line"
        role="img"
        aria-label={`Seçili dönemde gelir payı yüzde ${Math.round(incomeShare)}, gider payı yüzde ${Math.round(
          total === 0 ? 0 : 100 - incomeShare,
        )}`}
      >
        {total > 0 && (
          <>
            <div className="bg-income" style={{ width: `${incomeShare}%` }} />
            <div className="bg-expense" style={{ width: `${100 - incomeShare}%` }} />
          </>
        )}
      </div>
    </section>
  )
}
