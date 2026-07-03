import { X } from 'lucide-react'
import type { UploadError } from '../../types/markdown'
import { IconButton } from '../ui/IconButton'

interface UploadErrorsProps {
  errors: UploadError[]
  onDismiss: (id: string) => void
  className?: string
}

/** Inline, dismissible list of rejected/failed uploads. */
export function UploadErrors({
  errors,
  onDismiss,
  className = '',
}: UploadErrorsProps) {
  if (errors.length === 0) return null

  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {errors.map((error) => (
        <li
          key={error.id}
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-[color:var(--color-accent)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-fg)]"
        >
          <span>{error.message}</span>
          <IconButton
            aria-label={`Dismiss error for ${error.fileName}`}
            onClick={() => onDismiss(error.id)}
          >
            <X size={16} aria-hidden="true" />
          </IconButton>
        </li>
      ))}
    </ul>
  )
}
