import { useState } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface Props {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onConfirm()
            } finally {
              onClose()
            }
          }}
        >
          {busy ? 'Siliniyor…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
