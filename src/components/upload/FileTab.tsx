import { File, X } from 'lucide-react'
import type { MarkdownFile } from '../../types/markdown'
import { IconButton } from '../ui/IconButton'

interface FileTabProps {
  file: MarkdownFile
  isActive: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

/**
 * One row in the sidebar: a coral left-indicator bar marks the active file.
 * The select control and the remove control are siblings — never a button
 * nested inside a button.
 */
export function FileTab({ file, isActive, onSelect, onRemove }: FileTabProps) {
  return (
    <div
      className={`group relative flex items-center gap-2 rounded-[9px] pr-1 transition-colors ${
        isActive
          ? 'bg-[color:var(--color-surface-muted)]'
          : 'hover:bg-[color:var(--color-surface-muted)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-[3px] ${
          isActive ? 'bg-[color:var(--color-accent)]' : 'bg-transparent'
        }`}
      />
      <button
        type="button"
        onClick={() => onSelect(file.id)}
        aria-current={isActive ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-[9px] py-2 pl-[11px] pr-1 text-left"
      >
        <File
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
          className={
            isActive
              ? 'shrink-0 text-[color:var(--color-accent)]'
              : 'shrink-0 text-[color:var(--color-fg-faint)]'
          }
        />
        <span
          title={file.name}
          className={`truncate text-[13px] ${
            isActive
              ? 'font-semibold text-[color:var(--color-fg)]'
              : 'font-medium text-[color:var(--color-fg-muted)]'
          }`}
        >
          {file.name}
        </span>
      </button>
      <IconButton
        aria-label={`Remove ${file.name}`}
        onClick={() => onRemove(file.id)}
        className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X size={15} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
