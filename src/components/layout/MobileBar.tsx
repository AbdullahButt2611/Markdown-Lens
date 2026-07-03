import { Menu } from 'lucide-react'
import type { Theme } from '../../hooks/useTheme'
import { IconButton } from '../ui/IconButton'
import { ThemeToggle } from '../ui/ThemeToggle'

interface MobileBarProps {
  activeName: string | null
  onOpenSidebar: () => void
  theme: Theme
  onToggleTheme: () => void
}

/**
 * Top bar shown only below `md`, where the sidebar is an off-canvas drawer.
 * Opens the drawer, names the current file, and carries the theme toggle.
 */
export function MobileBar({
  activeName,
  onOpenSidebar,
  theme,
  onToggleTheme,
}: MobileBarProps) {
  return (
    <header className="flex items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 md:hidden">
      <IconButton aria-label="Open file list" onClick={onOpenSidebar}>
        <Menu size={20} aria-hidden="true" />
      </IconButton>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {activeName ?? 'Markdown Lens'}
      </span>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  )
}
