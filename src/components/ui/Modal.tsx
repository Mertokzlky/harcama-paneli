import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Yerel <dialog>: odak tuzağı, Esc ile kapanma ve arka plan erişilemezliği tarayıcıdan gelir. */
export function Modal({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 shadow-xl backdrop:bg-black/50"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="-mr-2 inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
