import { useCallback, useEffect, useRef, useState } from 'react'
import type { MarkdownFile } from '../types/markdown'

export type PdfExportStatus =
  | 'idle'
  | 'preparing'
  | 'generating'
  | 'done'
  | 'error'

interface UsePdfExport {
  /** Current phase, for button feedback. */
  status: PdfExportStatus
  /** The file being rendered offscreen right now (mount the surface for it). */
  pdfFile: MarkdownFile | null
  /** True while an export is in flight; callers should disable the trigger. */
  isBusy: boolean
  /** Begin exporting a file (ignored if one is already in flight). */
  start: (file: MarkdownFile) => void
  /** The surface finished rendering — capture and download. */
  handleReady: (surface: HTMLElement) => void
  /** The surface failed to settle. */
  handleError: (error: unknown) => void
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
 * Owns the PDF-export lifecycle. Rendering the document to a PDF happens against
 * an offscreen surface the caller mounts for `pdfFile`; when that surface reports
 * ready, this hook captures it, triggers the download, and tears the surface
 * down. Everything stays in the browser — nothing is uploaded or persisted.
 */
export function usePdfExport(): UsePdfExport {
  const [status, setStatus] = useState<PdfExportStatus>('idle')
  const [pdfFile, setPdfFile] = useState<MarkdownFile | null>(null)
  const activeFile = useRef<MarkdownFile | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const finish = useCallback((next: PdfExportStatus) => {
    setStatus(next)
    setPdfFile(null)
    activeFile.current = null
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setStatus('idle'), 2200)
  }, [])

  const start = useCallback((file: MarkdownFile) => {
    // Ignore re-entrancy: one export at a time.
    if (activeFile.current) return
    if (resetTimer.current) clearTimeout(resetTimer.current)
    activeFile.current = file
    setStatus('preparing')
    setPdfFile(file)
  }, [])

  const handleReady = useCallback(
    (surface: HTMLElement) => {
      const file = activeFile.current
      if (!file) return
      setStatus('generating')
      // Lazy-loaded so jsPDF + html2canvas stay out of the initial bundle and
      // only load when the reader actually exports (cf. the lazy mermaid import).
      void import('../lib/pdf/generatePdf')
        .then(({ generatePdf }) => generatePdf(surface, file.name))
        .then((blob) => {
          downloadBlob(blob, toPdfName(file.name))
          finish('done')
        })
        .catch(() => finish('error'))
    },
    [finish],
  )

  const handleError = useCallback(() => finish('error'), [finish])

  return {
    status,
    pdfFile,
    isBusy: status === 'preparing' || status === 'generating',
    start,
    handleReady,
    handleError,
  }
}
