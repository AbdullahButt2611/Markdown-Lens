import { FileText, X } from 'lucide-react'
import type { MarkdownFile } from '../../types/markdown'
import { IconButton } from '../ui/IconButton'

interface FileTabProps {
  file: MarkdownFile
  isActive: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

/**
 * One row in the sidebar: selects its file on click, removes it via the X.
 * The select control and the remove control are siblings — never a button
 * nested inside a button.
 */
export function FileTab({ file, isActive, onSelect, onRemove }: FileTabProps) {
  return (
    <div
      className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
        isActive
          ? 'bg-[color:var(--color-surface-muted)]'
          : 'hover:bg-[color:var(--color-surface-muted)]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(file.id)}
        aria-current={isActive ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm"
      >
        <FileText
          size={16}
          aria-hidden="true"
          className={
            isActive
              ? 'shrink-0 text-[color:var(--color-accent)]'
              : 'shrink-0 text-[color:var(--color-fg-muted)]'
          }
        />
        <span className="truncate" title={file.name}>
          {file.name}
        </span>
      </button>
      <IconButton
        aria-label={`Remove ${file.name}`}
        onClick={() => onRemove(file.id)}
        className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X size={16} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
