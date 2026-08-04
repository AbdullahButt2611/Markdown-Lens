import { useEffect, useRef } from 'react'
import type { MarkdownFile } from '../../types/markdown'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'

interface PdfRenderSurfaceProps {
  file: MarkdownFile
  /** Called once the content + all assets have settled, with the root element. */
  onReady: (surface: HTMLElement) => void
  /** Called if assets never settle (so the caller can stop the spinner). */
  onError: (error: unknown) => void
}

/** Give async work a hard ceiling so a stuck asset can't hang the export. */
const READY_TIMEOUT_MS = 12000
const POLL_MS = 100

/** Resolve once every <img> under `root` has finished (or errored) loading. */
function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  ).then(() => undefined)
}

/** Resolve once no Mermaid diagram is still in its "rendering" state. */
function waitForDiagrams(root: HTMLElement, signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (signal.cancelled) {
        resolve()
        return
      }
      const pending = root.querySelectorAll('[data-mermaid-state="rendering"]')
      if (pending.length === 0 || Date.now() - start > READY_TIMEOUT_MS) {
        resolve()
        return
      }
      window.setTimeout(check, POLL_MS)
    }
    check()
  })
}

/**
 * A hidden, fixed-width, forced-light copy of the document, rendered through the
 * SAME `MarkdownRenderer` pipeline so the PDF matches the on-screen reading view.
 * It lives offscreen (not `display:none`, which would collapse its layout) while
 * html2canvas captures it. Once fonts, images, and diagrams have settled it hands
 * its root element back to the caller via `onReady`.
 */
export function PdfRenderSurface({
  file,
  onReady,
  onError,
}: PdfRenderSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const signal = { cancelled: false }

    const run = async () => {
      try {
        // Fonts must be ready or text is measured/captured at fallback metrics.
        if (document.fonts?.ready) await document.fonts.ready
        await waitForDiagrams(root, signal)
        await waitForImages(root)
        // One frame so the final layout is committed before capture.
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        if (!signal.cancelled) onReady(root)
      } catch (error) {
        if (!signal.cancelled) onError(error)
      }
    }

    void run()
    return () => {
      signal.cancelled = true
    }
  }, [file, onReady, onError])

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }}
    >
      <div ref={ref} className="pdf-surface">
        <MarkdownRenderer content={file.content} images={file.images} />
      </div>
    </div>
  )
}
