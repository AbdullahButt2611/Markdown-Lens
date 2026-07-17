import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  AlertTriangle,
  Check,
  Image as ImageIcon,
  ImagePlus,
  X,
} from 'lucide-react'
import type { ImageRef } from '../../types/markdown'
import { IMAGE_ACCEPT_ATTR, isImageFile } from '../../lib/images'
import { createId } from '../../lib/ids'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { DropZone } from './DropZone'

interface ImageUploadModalProps {
  /** The document that references the images. */
  fileName: string
  /** The local images the document requires. */
  required: ImageRef[]
  /** Called with a map of `referencedUrl -> blob URL` when all are supplied. */
  onConfirm: (images: Record<string, string>) => void
  /** Called when the user abandons the upload; created URLs are revoked. */
  onCancel: () => void
}

interface Warning {
  id: string
  message: string
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])'

/**
 * Prompts the user to supply the local images a document references. Matching is
 * by file name; unreferenced or non-image files are flagged. The primary action
 * stays disabled until every referenced image is provided. Blob URLs created
 * here are revoked on cancel/unmount unless ownership passes on confirm.
 */
export function ImageUploadModal({
  fileName,
  required,
  onConfirm,
  onCancel,
}: ImageUploadModalProps) {
  // Resolved images keyed by lowercased file name -> blob URL.
  const [resolved, setResolved] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Warning[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const confirmedRef = useRef(false)
  // Mirror of live blob URLs, for revoking on cancel/unmount.
  const liveUrlsRef = useRef<Set<string>>(new Set())

  const requiredNames = useMemo(
    () => new Set(required.map((r) => r.name.toLowerCase())),
    [required],
  )

  const readyCount = required.filter(
    (r) => resolved[r.name.toLowerCase()],
  ).length
  const isComplete = readyCount === required.length

  const addImages = useCallback(
    (files: File[]) => {
      const nextWarnings: Warning[] = []
      const additions: Record<string, string> = {}

      for (const file of files) {
        if (!isImageFile(file)) {
          nextWarnings.push({
            id: createId(),
            message: `"${file.name}" Is Not A Supported Image Type.`,
          })
          continue
        }
        const key = file.name.toLowerCase()
        if (!requiredNames.has(key)) {
          nextWarnings.push({
            id: createId(),
            message: `"${file.name}" Is Not Referenced In This File.`,
          })
          continue
        }
        const url = URL.createObjectURL(file)
        liveUrlsRef.current.add(url)
        additions[key] = url
      }

      if (Object.keys(additions).length > 0) {
        setResolved((prev) => {
          // Revoke any image being replaced by a re-upload of the same name.
          for (const key of Object.keys(additions)) {
            const old = prev[key]
            if (old) {
              URL.revokeObjectURL(old)
              liveUrlsRef.current.delete(old)
            }
          }
          return { ...prev, ...additions }
        })
      }
      setWarnings(nextWarnings)
    },
    [requiredNames],
  )

  const handleCancel = useCallback(() => {
    for (const url of liveUrlsRef.current) URL.revokeObjectURL(url)
    liveUrlsRef.current.clear()
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    const images: Record<string, string> = {}
    for (const ref of required) {
      const url = resolved[ref.name.toLowerCase()]
      if (url) images[ref.url] = url
    }
    confirmedRef.current = true // ownership transfers; don't revoke on unmount
    onConfirm(images)
  }, [required, resolved, onConfirm])

  // Focus the panel on open; revoke on unmount if the user never confirmed.
  useEffect(() => {
    panelRef.current?.focus()
    const urls = liveUrlsRef.current
    return () => {
      if (!confirmedRef.current) {
        for (const url of urls) URL.revokeObjectURL(url)
      }
    }
  }, [])

  // Esc cancels; Tab is trapped within the panel.
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first?.focus()
      }
    },
    [handleCancel],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-desc"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl focus:outline-none"
      >
        {/* Header */}
        <header className="flex items-start gap-3 border-b border-[color:var(--color-border)] p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
            <ImageIcon size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="image-modal-title"
              className="text-lg font-semibold text-[color:var(--color-fg)]"
            >
              Upload Required Images
            </h2>
            <p
              id="image-modal-desc"
              className="mt-1 text-sm text-[color:var(--color-fg-muted)]"
            >
              This Document References Images That Must Be Added To Display It
              Correctly.
            </p>
          </div>
          <IconButton aria-label="Cancel image upload" onClick={handleCancel}>
            <X size={18} aria-hidden="true" />
          </IconButton>
        </header>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[color:var(--color-fg-faint)]">
              Required Images
            </span>
            <span className="text-xs font-medium text-[color:var(--color-fg-muted)]">
              {readyCount} Of {required.length} Images Added
            </span>
          </div>

          <ul className="space-y-2">
            {required.map((ref) => {
              const url = resolved[ref.name.toLowerCase()]
              return (
                <li
                  key={ref.url}
                  className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] p-2.5"
                >
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-md border border-[color:var(--color-border)] object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[color:var(--color-surface-muted)] text-[color:var(--color-fg-faint)]">
                      <ImageIcon size={16} aria-hidden="true" />
                    </span>
                  )}
                  <span
                    className="min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--color-fg)]"
                    title={ref.name}
                  >
                    {ref.name}
                  </span>
                  {url ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[color:var(--color-accent)]">
                      <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                      Ready
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-[color:var(--color-fg-faint)]">
                      Pending
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          <DropZone
            onFiles={addImages}
            accept={IMAGE_ACCEPT_ATTR}
            ariaLabel="Drop images here, or browse"
            className="!rounded-xl"
          >
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <ImagePlus
                size={24}
                aria-hidden="true"
                className="text-[color:var(--color-accent)]"
              />
              <p className="text-sm font-medium text-[color:var(--color-fg)]">
                Drop Images Here Or Browse
              </p>
              <p className="text-xs text-[color:var(--color-fg-faint)]">
                PNG, JPG, GIF, WEBP, Or SVG
              </p>
            </div>
          </DropZone>

          {warnings.length > 0 && (
            <ul className="space-y-2">
              {warnings.map((warning) => (
                <li
                  key={warning.id}
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-2 text-sm text-[color:var(--color-fg)]"
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[color:var(--color-accent)]"
                  />
                  <span>{warning.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-[color:var(--color-border)] p-4">
          <span
            className="min-w-0 truncate text-xs text-[color:var(--color-fg-faint)]"
            title={fileName}
          >
            {fileName}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!isComplete}>
              Insert Images
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
