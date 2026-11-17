import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category } from '../../lib/categories'
import { minorToInput, parseAmountToMinor } from '../../lib/format'
import { Button, fieldClass } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface Props {
  /** Seçilebilir kategoriler: eklemede limiti olmayanlar, düzenlemede yalnızca düzenlenen. */
  categories: Category[]
  /** Düzenleme modunda mevcut limit. */
  initial?: { categoryId: string; limitMinor: number }
  onSubmit: (categoryId: string, limitMinor: number) => Promise<void>
  /** Yalnızca düzenlemede verilir. */
  onRemove?: () => Promise<void>
  onClose: () => void
}

export function BudgetForm({ categories, initial, onSubmit, onRemove, onClose }: Props) {
  const editing = Boolean(initial)
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [amount, setAmount] = useState(initial ? minorToInput(initial.limitMinor) : '')
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const limitMinor = parseAmountToMinor(amount)
    if (limitMinor === null) {
      setError('Geçerli bir limit gir (örn. 2.500). Limit 0’dan büyük olmalı.')
      return
    }
    setError(null)
    setBusy(true)
    setSubmitError(null)
    try {
      await onSubmit(categoryId, limitMinor)
      onClose()
    } catch {
      setSubmitError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.')
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!onRemove) return
    setBusy(true)
    setSubmitError(null)
    try {
      await onRemove()
      onClose()
    } catch {
      setSubmitError('Limit kaldırılamadı. Tekrar dene.')
      setBusy(false)
    }
  }

  return (
    <Modal title={editing ? 'Bütçe limitini düzenle' : 'Bütçe limiti ekle'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="bf-category" className="mb-1.5 block text-sm font-semibold">
            Kategori
          </label>
          <select
            id="bf-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={editing}
            className={fieldClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bf-amount" className="mb-1.5 block text-sm font-semibold">
            Aylık limit (₺)
          </label>
          <input
            id="bf-amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'bf-amount-err' : 'bf-amount-hint'}
            placeholder="2.500"
            className={`${fieldClass} num`}
          />
          {error ? (
            <p id="bf-amount-err" className="mt-1.5 text-sm text-expense">
              {error}
            </p>
          ) : (
            <p id="bf-amount-hint" className="mt-1.5 text-xs text-muted">
              Bu limit her ay geçerli olur. Harcaman limitin %80’ine ulaşınca uyarı görürsün.
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div>
            {onRemove && (
              <Button variant="ghost" onClick={() => void handleRemove()} disabled={busy} className="text-expense">
                Limiti kaldır
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !categoryId}>
              {busy ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
