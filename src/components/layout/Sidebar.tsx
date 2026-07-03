import { Lock, Plus, X } from 'lucide-react'
import type { MarkdownFile } from '../../types/markdown'
import type { Theme } from '../../hooks/useTheme'
import { openFileDialog } from '../../lib/filePicker'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { FileTab } from '../upload/FileTab'

interface SidebarProps {
  files: MarkdownFile[]
  activeId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onFiles: (files: File[]) => void
  theme: Theme
  onToggleTheme: () => void
  /** Positioning/visibility classes supplied by the layout (drawer vs docked). */
  className?: string
  /** Close the mobile drawer; absent on desktop. */
  onClose?: () => void
}

/**
 * Slim left rail: brand, add-files action, the open-files list, and a privacy
 * footer. Owns no document content — purely navigation over the files state.
 */
export function Sidebar({
  files,
  activeId,
  onSelect,
  onRemove,
  onFiles,
  theme,
  onToggleTheme,
  className = '',
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`flex h-screen w-72 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-sidebar)] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 pb-3.5 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={30} iconSize={19} radius={9} />
          <span className="whitespace-nowrap font-display text-[17px] font-bold tracking-[-0.02em]">
            Markdown Lens
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {onClose && (
            <IconButton
              aria-label="Close file list"
              onClick={onClose}
              className="md:hidden"
            >
              <X size={18} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="ghost"
          onClick={() => openFileDialog(onFiles)}
          className="w-full"
        >
          <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
          Add Files
        </Button>
      </div>

      <div className="px-5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[color:var(--color-fg-faint)]">
        Open Files
      </div>

      <nav aria-label="Open files" className="flex-1 overflow-y-auto px-2.5 pb-2.5">
        <ul className="flex flex-col gap-0.5">
          {files.map((file) => (
            <li key={file.id}>
              <FileTab
                file={file}
                isActive={file.id === activeId}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-2 border-t border-[color:var(--color-border)] px-4 pb-3.5 pt-3">
        <Lock
          size={13}
          aria-hidden="true"
          className="shrink-0 text-[color:var(--color-fg-faint)]"
        />
        <span className="text-[11px] leading-tight text-[color:var(--color-fg-faint)]">
          In-Memory Only · Nothing Leaves Your Browser
        </span>
      </div>
    </aside>
  )
}
