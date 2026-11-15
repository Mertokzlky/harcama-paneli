import { formatMoney } from '../../lib/format'
import type { MonthComparison as Comparison } from '../../lib/stats'

interface Props {
  data: Comparison
}

/** "%12 daha az" gibi kısa ifade ve rengi üretir. higherIsGood: gelirde artış iyidir, giderde kötü. */
function describe(pct: number | null, cur: number, higherIsGood: boolean) {
  if (pct === null) {
    return cur > 0
      ? { text: 'Geçen ay aynı dönemde kayıt yoktu', tone: 'text-muted' }
      : { text: 'İki dönemde de kayıt yok', tone: 'text-muted' }
  }
  if (pct === 0) return { text: 'Geçen ayla aynı', tone: 'text-muted' }
  const up = pct > 0
  const good = up === higherIsGood
  return {
    text: `%${Math.abs(pct)} ${up ? 'daha fazla' : 'daha az'}`,
    tone: good ? 'text-income' : 'text-expense',
  }
}

export function MonthComparison({ data }: Props) {
  const expense = describe(data.expenseChangePct, data.current.expense, false)
  const income = describe(data.incomeChangePct, data.current.income, true)

  return (
    <section aria-labelledby="mom-title" className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="mom-title" className="text-base font-bold">
          Geçen ayla karşılaştırma
        </h2>
        <p className="text-xs text-muted">Her iki ayın ilk {data.day} günü · filtrelerden bağımsız</p>
      </div>

      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold text-muted">Gider</dt>
          <dd className="mt-1">
            <span className="num text-xl font-bold">{formatMoney(data.current.expense)}</span>{' '}
            <span className={`text-sm font-semibold ${expense.tone}`}>{expense.text}</span>
            <span className="num block text-xs text-muted">
              Geçen ay aynı dönemde {formatMoney(data.previous.expense)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-muted">Gelir</dt>
          <dd className="mt-1">
            <span className="num text-xl font-bold">{formatMoney(data.current.income)}</span>{' '}
            <span className={`text-sm font-semibold ${income.tone}`}>{income.text}</span>
            <span className="num block text-xs text-muted">
              Geçen ay aynı dönemde {formatMoney(data.previous.income)}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
