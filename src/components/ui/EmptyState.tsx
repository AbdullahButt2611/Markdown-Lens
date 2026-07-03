import { FileUp } from 'lucide-react'
import type { UploadError } from '../../types/markdown'
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_LABEL } from '../../lib/file'
import { DropZone } from '../upload/DropZone'
import { UploadErrors } from '../upload/UploadErrors'

interface EmptyStateProps {
  onFiles: (files: File[]) => void
  errors: UploadError[]
  onDismissError: (id: string) => void
}

/** Full-pane invitation shown when no files are open. */
export function EmptyState({ onFiles, errors, onDismissError }: EmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Markdown Lens
        </h1>
        <p className="mt-2 text-[color:var(--color-fg-muted)]">
          Read your Markdown, beautifully rendered. Files stay in your browser —
          nothing is uploaded, nothing is saved.
        </p>
      </div>

      <DropZone onFiles={onFiles} className="w-full">
        <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
          <FileUp
            size={40}
            aria-hidden="true"
            className="text-[color:var(--color-accent)]"
          />
          <div>
            <p className="text-lg font-medium">
              Drop Markdown files here, or browse
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              {ACCEPTED_EXTENSIONS.join(', ')} · up to {MAX_FILE_SIZE_LABEL} each
            </p>
          </div>
        </div>
      </DropZone>

      <UploadErrors
        errors={errors}
        onDismiss={onDismissError}
        className="w-full"
      />
    </div>
  )
}
