import { useState } from 'react'
import type { FormEvent } from 'react'
import { categoriesFor, defaultCategory } from '../../lib/categories'
import { isValidISODate, minorToInput, parseAmountToMinor, todayISO } from '../../lib/format'
import { MAX_NOTE_LENGTH } from '../../lib/types'
import type { Transaction, TransactionInput, TxType } from '../../lib/types'
import { Button, fieldClass } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface Props {
  initial?: Transaction
  onSubmit: (input: TransactionInput) => Promise<void>
  onClose: () => void
}

export function TransactionForm({ initial, onSubmit, onClose }: Props) {
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? minorToInput(initial.amountMinor) : '')
  const [category, setCategory] = useState(initial?.category ?? defaultCategory('expense'))
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function changeType(next: TxType) {
    setType(next)
    if (!categoriesFor(next).some((c) => c.id === category)) setCategory(defaultCategory(next))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    const amountMinor = parseAmountToMinor(amount)
    if (amountMinor === null) next.amount = 'Geçerli bir tutar gir (örn. 249,90). Tutar 0’dan büyük olmalı.'
    if (!isValidISODate(date)) next.date = 'Geçerli bir tarih seç.'
    setErrors(next)
    if (Object.keys(next).length > 0 || amountMinor === null) return

    setBusy(true)
    setSubmitError(null)
    try {
      await onSubmit({ type, amountMinor, category, date, note: note.trim() })
      onClose()
    } catch {
      setSubmitError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.')
      setBusy(false)
    }
  }

  return (
    <Modal title={initial ? 'İşlemi düzenle' : 'İşlem ekle'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <fieldset>
          <legend className="sr-only">İşlem türü</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
            {(['expense', 'income'] as const).map((t) => (
              <label
                key={t}
                className={`flex min-h-9 cursor-pointer items-center justify-center rounded-md text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                  type === t ? 'bg-surface text-ink shadow-sm' : 'text-muted'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => changeType(t)}
                  className="sr-only"
                />
                {t === 'expense' ? 'Gider' : 'Gelir'}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="tx-amount" className="mb-1.5 block text-sm font-semibold">
            Tutar (₺)
          </label>
          <input
            id="tx-amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? 'tx-amount-err' : undefined}
            placeholder="0,00"
            className={`${fieldClass} num`}
          />
          {errors.amount && (
            <p id="tx-amount-err" className="mt-1.5 text-sm text-expense">
              {errors.amount}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tx-category" className="mb-1.5 block text-sm font-semibold">
              Kategori
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              {categoriesFor(type).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-date" className="mb-1.5 block text-sm font-semibold">
              Tarih
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={Boolean(errors.date)}
              className={fieldClass}
            />
            {errors.date && <p className="mt-1.5 text-sm text-expense">{errors.date}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="tx-note" className="mb-1.5 block text-sm font-semibold">
            Not <span className="font-normal text-muted">(isteğe bağlı)</span>
          </label>
          <textarea
            id="tx-note"
            rows={2}
            maxLength={MAX_NOTE_LENGTH}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} py-2`}
          />
        </div>

        {submitError && (
          <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Kaydediliyor…' : initial ? 'Değişiklikleri kaydet' : 'İşlemi kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
