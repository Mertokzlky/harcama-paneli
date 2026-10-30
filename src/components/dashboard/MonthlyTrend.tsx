import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatMoney } from '../../lib/format'
import type { MonthPoint } from '../../lib/stats'
import { EmptyState } from '../ui/EmptyState'

export function MonthlyTrend({ data }: { data: MonthPoint[] }) {
  const chartData = data.map((d) => ({
    label: d.label,
    Gelir: d.income / 100,
    Gider: d.expense / 100,
  }))

  return (
    <section aria-labelledby="trend-title" className="rounded-2xl border border-line bg-surface p-5">
      <h2 id="trend-title" className="text-base font-bold">
        Aylık gelir ve gider
      </h2>

      {data.length === 0 ? (
        <EmptyState
          compact
          icon="search"
          title="Trend için veri yok"
          description="İşlem ekledikçe son 6 ayın gelir ve gider karşılaştırması burada görünür."
        />
      ) : (
        <div
          className="mt-4 h-64"
          role="img"
          aria-label={`Son aylar: ${data
            .map((d) => `${d.label} gelir ${formatMoney(d.income)}, gider ${formatMoney(d.expense)}`)
            .join('; ')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: 'var(--line)' }}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={60}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                tickFormatter={(v) => formatCompact(Number(v) * 100)}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                formatter={(value) => formatMoney(Math.round(Number(value) * 100))}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  color: 'var(--ink)',
                }}
                labelStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                itemStyle={{ color: 'var(--ink)' }}
              />
              <Legend iconType="square" wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              <Bar dataKey="Gelir" fill="var(--income)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Gider" fill="var(--expense)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
