import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { parseTransactionsCsv, toCsv } from '../../lib/csv'
import type { CsvParseResult } from '../../lib/csv'
import { todayISO } from '../../lib/format'
import type { Transaction, TransactionInput } from '../../lib/types'
import { useToast } from '../../hooks/useToast'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'

const MAX_FILE_BYTES = 1_000_000

interface Props {
  /** Dışa aktarılacak (filtrelenmiş) işlemler. */
  exportItems: Transaction[]
  onImport: (rows: TransactionInput[]) => Promise<void>
}

export function CsvTools({ exportItems, onImport }: Props) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ name: string; result: CsvParseResult } | null>(null)
  const [busy, setBusy] = useState(false)

  function exportCsv() {
    const blob = new Blob([toCsv(exportItems)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `harcama-paneli-${todayISO()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`${exportItems.length} işlem dışa aktarıldı.`)
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // aynı dosya tekrar seçilebilsin
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      toast('Dosya çok büyük (en fazla 1 MB).', 'error')
      return
    }
    const text = await file.text()
    setPreview({ name: file.name, result: parseTransactionsCsv(text) })
  }

  async function confirmImport() {
    if (!preview) return
    setBusy(true)
    try {
      await onImport(preview.result.rows)
      toast(`${preview.result.rows.length} işlem içe aktarıldı.`)
      setPreview(null)
    } catch {
      toast('İçe aktarma başarısız oldu. Tekrar dene.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const result = preview?.result

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => fileRef.current?.click()}>
          <Icon name="upload" className="size-4" />
          CSV içe aktar
        </Button>
        <Button onClick={exportCsv} disabled={exportItems.length === 0}>
          <Icon name="download" className="size-4" />
          CSV dışa aktar
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFile(e)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {preview && result && (
        <Modal title="CSV içe aktarma" onClose={() => setPreview(null)}>
          <p className="text-sm text-muted">{preview.name}</p>
          <p className="mt-3 text-sm">
            <strong className="text-income">{result.rows.length}</strong> geçerli satır
            {result.issues.length > 0 && (
              <>
                , <strong className="text-expense">{result.issues.length}</strong> hatalı satır (atlanacak)
              </>
            )}
            .
          </p>
          {result.issues.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-auto rounded-lg bg-surface-2 p-3 text-xs">
              {result.issues.slice(0, 20).map((i, idx) => (
                <li key={idx}>
                  <span className="font-semibold">Satır {i.line}:</span> {i.message}
                </li>
              ))}
              {result.issues.length > 20 && <li>… ve {result.issues.length - 20} hata daha</li>}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Beklenen sütunlar: Tarih; Tür (Gelir/Gider); Kategori; Tutar; Not. Mevcut kayıtlar silinmez; aynı
            satırları iki kez içe aktarırsan çift kayıt oluşur.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Vazgeç
            </Button>
            <Button variant="primary" disabled={busy || result.rows.length === 0} onClick={() => void confirmImport()}>
              {busy ? 'Aktarılıyor…' : `${result.rows.length} işlemi içe aktar`}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
