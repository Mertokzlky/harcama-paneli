import { useState } from 'react'
import { getCategory } from '../../lib/categories'
import { formatDate, formatMoney } from '../../lib/format'
import type { Transaction } from '../../lib/types'
import { Button, IconButton } from '../ui/Button'
import { Icon } from '../ui/Icon'

const PAGE = 50

interface Props {
  items: Transaction[]
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

export function TransactionList({ items, onEdit, onDelete }: Props) {
  const [visible, setVisible] = useState(PAGE)
  const shown = items.slice(0, visible)

  return (
    <div>
      <ul className="divide-y divide-line">
        {shown.map((t) => {
          const cat = getCategory(t.category)
          const sign = t.type === 'income' ? '+' : '−'
          return (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: cat.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.note || cat.label}</p>
                <p className="truncate text-xs text-muted">
                  {t.note ? `${cat.label} · ` : ''}
                  {formatDate(t.date)}
                </p>
              </div>
              <p
                className={`num shrink-0 text-sm font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}
              >
                <span className="sr-only">{t.type === 'income' ? 'Gelir ' : 'Gider '}</span>
                {sign} {formatMoney(t.amountMinor)}
              </p>
              <div className="flex shrink-0">
                <IconButton label={`Düzenle: ${t.note || cat.label}`} onClick={() => onEdit(t)}>
                  <Icon name="edit" className="size-4" />
                </IconButton>
                <IconButton label={`Sil: ${t.note || cat.label}`} onClick={() => onDelete(t)}>
                  <Icon name="trash" className="size-4" />
                </IconButton>
              </div>
            </li>
          )
        })}
      </ul>
      {items.length > visible && (
        <div className="pt-3 text-center">
          <Button onClick={() => setVisible((v) => v + PAGE)}>
            Daha fazla göster ({items.length - visible} işlem)
          </Button>
        </div>
      )}
    </div>
  )
}
