import { useCallback, useState } from 'react'
import type { DragEvent, KeyboardEvent, ReactNode } from 'react'
import { openFileDialog } from '../../lib/filePicker'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  children: ReactNode
  className?: string
}

/**
 * Interaction wrapper: highlights while a file is dragged over it, accepts a
 * drop, and opens the file dialog on click or Enter/Space. Purely presentational
 * content is passed as children (see EmptyState).
 */
export function DropZone({ onFiles, children, className = '' }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const browse = useCallback(() => openFileDialog(onFiles), [onFiles])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = Array.from(e.dataTransfer.files)
      if (dropped.length > 0) onFiles(dropped)
    },
    [onFiles],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        browse()
      }
    },
    [browse],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop Markdown files here, or browse"
      onClick={browse}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`cursor-pointer rounded-2xl border-2 border-dashed transition-colors ${
        isDragging
          ? 'border-[color:var(--color-accent)] bg-[color:var(--color-surface-muted)]'
          : 'border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]'
      } ${className}`}
    >
      {children}
    </div>
  )
}
