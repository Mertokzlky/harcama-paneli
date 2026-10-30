import type { AppUser } from '../../lib/types'
import { useTheme } from '../../hooks/useTheme'
import { authService } from '../../services'
import { Button, IconButton } from '../ui/Button'
import { Icon } from '../ui/Icon'

export function Header({ user, onAdd }: { user: AppUser; onAdd: () => void }) {
  const { theme, toggle } = useTheme()
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-ink">
            <Icon name="wallet" className="size-5" />
          </span>
          <span className="whitespace-nowrap text-base font-extrabold tracking-tight">Harcama Paneli</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden max-w-48 truncate text-sm text-muted md:block" title={user.email}>
            {user.email}
          </span>
          <Button variant="primary" onClick={onAdd} aria-label="İşlem ekle" className="whitespace-nowrap">
            <Icon name="plus" className="size-4" />
            <span className="sm:hidden">Ekle</span>
            <span className="hidden sm:inline">İşlem ekle</span>
          </Button>
          <IconButton label={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'} onClick={toggle}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </IconButton>
          <IconButton label="Çıkış yap" onClick={() => void authService.signOut()}>
            <Icon name="logout" />
          </IconButton>
        </div>
      </div>
    </header>
  )
}
