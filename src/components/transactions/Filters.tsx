import { CATEGORIES } from '../../lib/categories'
import { hasActiveFilters, presetRange } from '../../lib/filters'
import type { Preset } from '../../lib/filters'
import { EMPTY_FILTERS } from '../../lib/types'
import type { Filters as FiltersState } from '../../lib/types'
import { Button, fieldClass } from '../ui/Button'
import { Icon } from '../ui/Icon'

interface Props {
  value: FiltersState
  onChange: (next: FiltersState) => void
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'this-month', label: 'Bu ay' },
  { id: 'last-3-months', label: 'Son 3 ay' },
]

export function Filters({ value, onChange }: Props) {
  const set = (patch: Partial<FiltersState>) => onChange({ ...value, ...patch })

  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.id)
    return r.from === value.from && r.to === value.to
  })?.id

  return (
    <section aria-label="Filtreler" className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Hızlı dönem seçimi" className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={activePreset === p.id}
              onClick={() => set(presetRange(p.id))}
              className={`min-h-8 rounded-md px-3 text-sm font-semibold ${
                activePreset === p.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-48 flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="İşlemlerde ara"
            placeholder="Not veya kategoride ara"
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            className={`${fieldClass} pl-9`}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="f-from" className="mb-1 block text-xs font-semibold text-muted">
            Başlangıç tarihi
          </label>
          <input
            id="f-from"
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => set({ from: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="f-to" className="mb-1 block text-xs font-semibold text-muted">
            Bitiş tarihi
          </label>
          <input
            id="f-to"
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => set({ to: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="f-type" className="mb-1 block text-xs font-semibold text-muted">
            Tür
          </label>
          <select
            id="f-type"
            value={value.type}
            onChange={(e) => set({ type: e.target.value as FiltersState['type'] })}
            className={fieldClass}
          >
            <option value="all">Gelir ve gider</option>
            <option value="income">Sadece gelir</option>
            <option value="expense">Sadece gider</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-category" className="mb-1 block text-xs font-semibold text-muted">
            Kategori
          </label>
          <select
            id="f-category"
            value={value.category}
            onChange={(e) => set({ category: e.target.value })}
            className={fieldClass}
          >
            <option value="all">Tüm kategoriler</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters(value) && (
        <div className="mt-3">
          <Button variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
            <Icon name="x" className="size-4" />
            Filtreleri temizle
          </Button>
        </div>
      )}
    </section>
  )
}
