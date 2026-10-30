import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '../../lib/format'
import type { CategorySlice } from '../../lib/stats'
import { EmptyState } from '../ui/EmptyState'

export function CategoryPie({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <section aria-labelledby="pie-title" className="rounded-2xl border border-line bg-surface p-5">
      <h2 id="pie-title" className="text-base font-bold">
        Giderlerin kategoriye göre dağılımı
      </h2>

      {data.length === 0 ? (
        <EmptyState
          compact
          icon="search"
          title="Gösterilecek gider yok"
          description="Seçili filtrelerde gider kaydı bulunmuyor."
        />
      ) : (
        <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <div
            className="mx-auto h-52 w-full max-w-52"
            role="img"
            aria-label={`Gider dağılımı: ${data.map((d) => `${d.label} ${formatMoney(d.value)}`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="100%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    color: 'var(--ink)',
                  }}
                  itemStyle={{ color: 'var(--ink)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-2 text-sm">
            {data.slice(0, 7).map((d) => (
              <li key={d.id} className="flex items-center gap-2.5">
                <span className="size-3 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{d.label}</span>
                <span className="num text-muted">%{Math.round((d.value / total) * 100)}</span>
                <span className="num w-28 text-right font-semibold">{formatMoney(d.value)}</span>
              </li>
            ))}
            {data.length > 7 && (
              <li className="text-xs text-muted">+ {data.length - 7} kategori daha</li>
            )}
          </ul>
        </div>
      )}
    </section>
  )
}
