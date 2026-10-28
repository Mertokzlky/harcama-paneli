import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface Props {
  icon?: IconName
  title: string
  description: string
  children?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon = 'wallet', title, description, children, compact = false }: Props) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-8' : 'py-14'}`}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon name={icon} className="size-6" />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
