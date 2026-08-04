import { createId } from '../ids'

/** A rasterized image plus its intrinsic pixel size (for aspect-correct sizing). */
export interface RasterImage {
  dataUrl: string
  width: number
  height: number
}

/** Absolute URL, protocol-relative, or an already-inlined data/blob URL. */
function isAbsolute(src: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(src) ||
    src.startsWith('//') ||
    src.startsWith('data:') ||
    src.startsWith('blob:')
  )
}

/** Rasterize a self-contained SVG string to a PNG data URL at 2x. */
async function svgToPng(svg: string): Promise<RasterImage> {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const el = parsed.documentElement
  let w = parseFloat(el.getAttribute('width') ?? '')
  let h = parseFloat(el.getAttribute('height') ?? '')
  if (!w || !h) {
    const vb = (el.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number)
    if (vb.length === 4) {
      w = vb[2] ?? 0
      h = vb[3] ?? 0
    }
  }
  w = w || 600
  h = h || 400
  el.setAttribute('width', String(w))
  el.setAttribute('height', String(h))

  const xml = new XMLSerializer().serializeToString(el)
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h }
}

/**
 * Render a Mermaid diagram to a PNG data URL, entirely in the browser. Uses the
 * app's light palette so the diagram sits well on the white PDF page. Returns
 * null on failure so the caller can fall back to the raw source.
 */
export async function renderDiagram(code: string): Promise<RasterImage | null> {
  try {
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'Helvetica, Arial, sans-serif',
      themeVariables: {
        background: '#ffffff',
        primaryColor: '#edeae0',
        primaryBorderColor: '#c15f3c',
        primaryTextColor: '#2b2a26',
        secondaryColor: '#faf9f5',
        tertiaryColor: '#faf9f5',
        lineColor: '#6b6a63',
        textColor: '#2b2a26',
        fontSize: '14px',
      },
    })
    const { svg } = await mermaid.render(`pdf-mermaid-${createId()}`, code)
    return await svgToPng(svg)
  } catch {
    return null
  }
}

/**
 * Resolve a markdown image reference to embeddable image bytes. Local references
 * (blob URLs the user supplied) and data URLs are inlined via canvas; absolute
 * http(s) images are best-effort (canvas taint falls back to the raw URL). The
 * intrinsic size is always read so the image can be scaled to fit the page.
 */
export async function resolveImage(
  src: string,
  images: Record<string, string>,
): Promise<RasterImage | null> {
  const resolved = images[src] ?? (isAbsolute(src) ? src : null)
  if (!resolved) return null
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = resolved
    })
    const width = img.naturalWidth || 1
    const height = img.naturalHeight || 1

    if (resolved.startsWith('data:')) {
      return { dataUrl: resolved, width, height }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return { dataUrl: resolved, width, height }
    ctx.drawImage(img, 0, 0)
    try {
      return { dataUrl: canvas.toDataURL('image/png'), width, height }
    } catch {
      // Cross-origin taint: hand the URL to react-pdf to fetch itself.
      return { dataUrl: resolved, width, height }
    }
  } catch {
    return null
  }
}
