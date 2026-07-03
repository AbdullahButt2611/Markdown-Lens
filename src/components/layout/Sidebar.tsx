import { Plus, X } from 'lucide-react'
import type { MarkdownFile } from '../../types/markdown'
import type { Theme } from '../../hooks/useTheme'
import { openFileDialog } from '../../lib/filePicker'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
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
 * Slim left rail: brand, the open-files list, and an add-files action.
 * Owns no document content — purely navigation over the files state.
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
      className={`flex h-screen w-64 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <span className="font-display text-lg font-bold tracking-tight">
          Markdown Lens
        </span>
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

      <nav
        aria-label="Open files"
        className="flex-1 overflow-y-auto px-2 pb-2"
      >
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

      <div className="border-t border-[color:var(--color-border)] p-3">
        <Button
          variant="ghost"
          onClick={() => openFileDialog(onFiles)}
          className="w-full"
        >
          <Plus size={16} aria-hidden="true" />
          Add files
        </Button>
      </div>
    </aside>
  )
}
