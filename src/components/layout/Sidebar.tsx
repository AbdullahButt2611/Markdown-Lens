import { Plus } from 'lucide-react'
import type { MarkdownFile } from '../../types/markdown'
import type { Theme } from '../../hooks/useTheme'
import { openFileDialog } from '../../lib/filePicker'
import { Button } from '../ui/Button'
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
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="font-display text-lg font-bold tracking-tight">
          Markdown Lens
        </span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
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
