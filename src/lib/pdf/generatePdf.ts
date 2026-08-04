import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas-pro'
import { paginate, type Range } from './paginate'

/**
 * Turns a fully-rendered, offscreen "print surface" into a paginated PDF Blob —
 * entirely in the browser (no backend, nothing persisted; see CLAUDE.md).
 *
 * The surface is the real `MarkdownRenderer` output at a fixed page width, so the
 * PDF looks like what the reader sees. The work here is faithful pagination:
 *   1. Mermaid SVGs are flattened to raster <img>s so diagrams paste in cleanly
 *      at their exact on-screen size.
 *   2. Unbreakable blocks (code, tables, diagrams, images) are measured so a page
 *      never cuts through one — the block is pushed to the next page instead.
 *   3. The surface is captured once at high scale, sliced per page, and each
 *      slice placed on an A4 page with a "Page X of Y" footer.
 */

// A4 in points, with comfortable margins. The bottom margin leaves room for the
// footer. Content is mapped from surface-px into this content box.
const MARGIN_X = 40
const MARGIN_TOP = 46
const MARGIN_BOTTOM = 54
// Capture scale — higher keeps rasterized text crisp at the cost of file size.
const CAPTURE_SCALE = 2

/**
 * Replace every rendered Mermaid `<svg>` with an equivalent raster `<img>` of the
 * same box. This sidesteps html2canvas's shaky `<foreignObject>` handling and
 * guarantees the diagram is embedded as an image at the correct size. On any
 * failure the original SVG is left in place for html2canvas to attempt.
 */
async function flattenDiagrams(root: HTMLElement): Promise<void> {
  const svgs = Array.from(
    root.querySelectorAll<SVGSVGElement>('[data-mermaid-state="done"] svg'),
  )

  await Promise.all(
    svgs.map(async (svg) => {
      try {
        const rect = svg.getBoundingClientRect()
        const w = Math.max(1, Math.round(rect.width))
        const h = Math.max(1, Math.round(rect.height))

        const clone = svg.cloneNode(true) as SVGSVGElement
        clone.setAttribute('width', String(w))
        clone.setAttribute('height', String(h))
        if (!clone.getAttribute('xmlns')) {
          clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        }

        const xml = new XMLSerializer().serializeToString(clone)
        const svgUrl =
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)

        const svgImg = new Image()
        await new Promise<void>((resolve, reject) => {
          svgImg.onload = () => resolve()
          svgImg.onerror = reject
          svgImg.src = svgUrl
        })

        // Rasterize at 2x so the diagram stays sharp in the PDF.
        const canvas = document.createElement('canvas')
        canvas.width = w * 2
        canvas.height = h * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(svgImg, 0, 0, w * 2, h * 2)

        const out = new Image()
        out.src = canvas.toDataURL('image/png')
        out.style.width = `${w}px`
        out.style.height = `${h}px`
        out.style.display = 'block'
        out.style.margin = '0 auto'
        await new Promise<void>((resolve) => {
          if (out.complete) resolve()
          else out.onload = () => resolve()
        })

        svg.replaceWith(out)
      } catch {
        // Leave the SVG in place; html2canvas will do its best.
      }
    }),
  )
}

/** Vertical spans (relative to the surface top) of blocks that must not split. */
function collectAvoidRanges(surface: HTMLElement): Range[] {
  const surfaceTop = surface.getBoundingClientRect().top
  return Array.from(surface.querySelectorAll<HTMLElement>('.pdf-atomic')).map(
    (el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top - surfaceTop, bottom: r.bottom - surfaceTop }
    },
  )
}

/** Draw a centered `Page X of Y` footer on every page. */
function stampFooters(doc: jsPDF, pageW: number, pageH: number): void {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140)
    doc.text(
      `Page ${i} of ${total}`,
      pageW / 2,
      pageH - MARGIN_BOTTOM / 2,
      { align: 'center' },
    )
  }
}

export async function generatePdf(
  surface: HTMLElement,
  fileName: string,
): Promise<Blob> {
  await flattenDiagrams(surface)

  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - MARGIN_X * 2
  const contentH = pageH - MARGIN_TOP - MARGIN_BOTTOM

  const surfaceWidthPx = surface.getBoundingClientRect().width
  const totalHeightPx = surface.scrollHeight
  const pxToPt = contentW / surfaceWidthPx
  const pageHeightPx = contentH / pxToPt

  const avoidRanges = collectAvoidRanges(surface)

  const canvas = await html2canvas(surface, {
    scale: CAPTURE_SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: Math.ceil(surfaceWidthPx),
    windowHeight: Math.ceil(totalHeightPx),
  })

  // Actual captured scale (canvas px per surface px) — used to slice precisely.
  const scale = canvas.width / surfaceWidthPx
  const slices = paginate(totalHeightPx, pageHeightPx, avoidRanges)

  slices.forEach((slice, index) => {
    const srcY = Math.round(slice.top * scale)
    const srcH = Math.round((slice.bottom - slice.top) * scale)
    if (srcH <= 0) return

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = srcH
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

    const drawH = (slice.bottom - slice.top) * pxToPt
    if (index > 0) doc.addPage()
    doc.addImage(
      pageCanvas.toDataURL('image/png'),
      'PNG',
      MARGIN_X,
      MARGIN_TOP,
      contentW,
      drawH,
      undefined,
      'FAST',
    )
  })

  stampFooters(doc, pageW, pageH)

  // `fileName` is embedded as document metadata only; the download name is set
  // by the caller. Content stays entirely in-browser.
  doc.setProperties({ title: fileName })
  return doc.output('blob')
}
