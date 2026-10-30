import { useMemo, useState } from 'react'
import { applyFilters, hasActiveFilters } from '../../lib/filters'
import { expenseByCategory, monthlyTrend, summarize } from '../../lib/stats'
import { EMPTY_FILTERS } from '../../lib/types'
import type { AppUser, Filters as FiltersState, Transaction, TransactionInput } from '../../lib/types'
import { useToast } from '../../hooks/useToast'
import { useTransactions } from '../../hooks/useTransactions'
import { transactionService } from '../../services'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Icon } from '../ui/Icon'
import { ConfirmDialog } from '../transactions/ConfirmDialog'
import { CsvTools } from '../transactions/CsvTools'
import { Filters } from '../transactions/Filters'
import { TransactionForm } from '../transactions/TransactionForm'
import { TransactionList } from '../transactions/TransactionList'
import { CategoryPie } from './CategoryPie'
import { Header } from './Header'
import { MonthlyTrend } from './MonthlyTrend'
import { SummaryStrip } from './SummaryStrip'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; tx: Transaction }

export function Dashboard({ user }: { user: AppUser }) {
  const toast = useToast()
  const { transactions, loading, error } = useTransactions(user.uid)
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS)
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [toDelete, setToDelete] = useState<Transaction | null>(null)

  const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters])
  const allTime = useMemo(() => summarize(transactions), [transactions])
  const period = useMemo(() => summarize(filtered), [filtered])
  const slices = useMemo(() => expenseByCategory(filtered), [filtered])
  const trend = useMemo(() => monthlyTrend(filtered), [filtered])

  const filtering = hasActiveFilters(filters)
  const openCreate = () => setForm({ mode: 'create' })

  async function save(input: TransactionInput) {
    if (form.mode === 'edit') {
      await transactionService.update(user.uid, form.tx.id, input)
      toast('İşlem güncellendi.')
    } else {
      await transactionService.add(user.uid, input)
      toast('İşlem eklendi.')
    }
  }

  async function remove(tx: Transaction) {
    try {
      await transactionService.remove(user.uid, tx.id)
      toast('İşlem silindi.')
    } catch {
      toast('İşlem silinemedi. Tekrar dene.', 'error')
    }
  }

  return (
    <>
      <Header user={user} onAdd={openCreate} />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {error && (
          <p role="alert" className="rounded-lg bg-expense/10 px-4 py-3 text-sm font-medium text-expense">
            Veriler yüklenemedi: erişim izni ya da bağlantı sorunu olabilir. Firestore kurallarının
            yayınlandığından emin ol. ({error})
          </p>
        )}

        {loading ? (
          <p className="py-20 text-center text-muted" role="status">
            Yükleniyor…
          </p>
        ) : transactions.length === 0 && !error ? (
          <section className="rounded-2xl border border-dashed border-line bg-surface">
            <EmptyState
              title="Henüz işlem yok"
              description="İlk gelirini ya da giderini ekle; bakiye ve grafikler otomatik oluşur. Başka bir yerden geliyorsan CSV ile toplu aktarabilirsin."
            >
              <Button variant="primary" onClick={openCreate}>
                <Icon name="plus" className="size-4" />
                İlk işlemi ekle
              </Button>
              <CsvTools exportItems={[]} onImport={(rows) => transactionService.addMany(user.uid, rows)} />
            </EmptyState>
          </section>
        ) : (
          <>
            <SummaryStrip
              balance={allTime.net}
              period={period}
              periodLabel={filtering ? 'Seçili filtreler' : 'Tüm zamanlar'}
            />
            <Filters value={filters} onChange={setFilters} />

            <div className="grid gap-5 lg:grid-cols-2">
              <CategoryPie data={slices} />
              <MonthlyTrend data={trend} />
            </div>

            <section aria-labelledby="list-title" className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="list-title" className="text-base font-bold">
                  İşlemler <span className="font-normal text-muted">({filtered.length})</span>
                </h2>
                <CsvTools exportItems={filtered} onImport={(rows) => transactionService.addMany(user.uid, rows)} />
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  compact
                  icon="search"
                  title="Filtreye uyan işlem yok"
                  description="Tarih aralığını genişletmeyi ya da aramayı değiştirmeyi dene."
                >
                  <Button onClick={() => setFilters(EMPTY_FILTERS)}>Filtreleri temizle</Button>
                </EmptyState>
              ) : (
                <div className="mt-2">
                  <TransactionList
                    items={filtered}
                    onEdit={(tx) => setForm({ mode: 'edit', tx })}
                    onDelete={setToDelete}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {form.mode !== 'closed' && (
        <TransactionForm
          key={form.mode === 'edit' ? form.tx.id : 'new'}
          initial={form.mode === 'edit' ? form.tx : undefined}
          onSubmit={save}
          onClose={() => setForm({ mode: 'closed' })}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="İşlemi sil"
          message="Bu işlem kalıcı olarak silinecek. Bu işlem geri alınamaz."
          confirmLabel="Sil"
          onConfirm={() => remove(toDelete)}
          onClose={() => setToDelete(null)}
        />
      )}
    </>
  )
}
