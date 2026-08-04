import { useCallback, useEffect, useRef, useState } from 'react'
import type { MarkdownFile } from '../types/markdown'

export type PdfExportStatus = 'idle' | 'generating' | 'done' | 'error'

interface UsePdfExport {
  /** Current phase, for button feedback. */
  status: PdfExportStatus
  /** True while an export is in flight; callers should disable the trigger. */
  isBusy: boolean
  /** Generate and download a PDF for the file (ignored if one is in flight). */
  start: (file: MarkdownFile) => void
}

/** Turn a document name into a sensible `.pdf` download name. */
function toPdfName(name: string): string {
  return name.replace(/\.mdx?$/i, '') + '.pdf'
}

/** Save a Blob to disk via a transient object URL (revoked immediately after). */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/**
 * Owns the PDF-export lifecycle. Building the PDF (parse → rasterize assets →
 * render vector document) runs entirely in the browser; the resulting Blob is
 * downloaded and never uploaded or persisted.
 */
export function usePdfExport(): UsePdfExport {
  const [status, setStatus] = useState<PdfExportStatus>('idle')
  const busy = useRef(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const finish = useCallback((next: PdfExportStatus) => {
    busy.current = false
    setStatus(next)
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setStatus('idle'), 2200)
  }, [])

  const start = useCallback(
    (file: MarkdownFile) => {
      if (busy.current) return
      busy.current = true
      if (resetTimer.current) clearTimeout(resetTimer.current)
      setStatus('generating')
      // Lazy-loaded so @react-pdf/renderer stays out of the initial bundle and
      // only loads when the reader actually exports.
      void import('../lib/pdf/generatePdf')
        .then(({ generatePdf }) => generatePdf(file))
        .then((blob) => {
          downloadBlob(blob, toPdfName(file.name))
          finish('done')
        })
        .catch(() => finish('error'))
    },
    [finish],
  )

  return { status, isBusy: status === 'generating', start }
}
