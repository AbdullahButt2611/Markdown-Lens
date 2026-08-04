import { createId } from '../ids'

/** A rasterized image plus its intrinsic pixel size (for aspect-correct sizing). */
export interface RasterImage {
  dataUrl: string
  width: number
  height: number
  /** True for SVGs — vector, so they can fill the column crisply at any size. */
  vector?: boolean
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
  // Mermaid can emit an HTML <br> (not valid XML); self-close it so the SVG
  // still loads as an image.
  const clean = svg.replace(/<br\s*>/gi, '<br/>')
  const parsed = new DOMParser().parseFromString(clean, 'image/svg+xml')
  const el = parsed.documentElement

  // Prefer the viewBox for intrinsic size — mermaid sets width/height to "100%".
  let w = 0
  let h = 0
  const vb = (el.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number)
  if (vb.length === 4) {
    w = vb[2] ?? 0
    h = vb[3] ?? 0
  }
  if (!w || !h) {
    const rawW = el.getAttribute('width') ?? ''
    const rawH = el.getAttribute('height') ?? ''
    if (!rawW.includes('%')) w = parseFloat(rawW) || w
    if (!rawH.includes('%')) h = parseFloat(rawH) || h
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
  const mermaid = (await import('mermaid')).default

  // Retry a few times: mermaid keeps global state, so a render can be corrupted
  // by a concurrent (on-screen) render. A fresh attempt reliably recovers.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        // Render labels as pure SVG <text> (not HTML in <foreignObject>). Labels
        // with <br> otherwise produce a foreignObject that fails to rasterize
        // when the SVG is loaded as an image (diagram falls back to raw code).
        htmlLabels: false,
        flowchart: { htmlLabels: false },
        class: { htmlLabels: false },
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
      // Transient failure — try again.
    }
  }
  return null
}

/** Whether a reference points at an SVG (which react-pdf's <Image> can't draw). */
function isSvgSource(resolved: string, src: string): boolean {
  return /^data:image\/svg/i.test(resolved) || /\.svgz?($|[?#])/i.test(src)
}

/** Best-effort intrinsic size of an SVG data URL, from its viewBox or width/height. */
function svgSizeFromDataUrl(resolved: string): { w: number; h: number } {
  try {
    if (!/^data:image\/svg/i.test(resolved)) return { w: 0, h: 0 }
    const comma = resolved.indexOf(',')
    const header = resolved.slice(0, comma)
    const raw = resolved.slice(comma + 1)
    const body = /;base64/i.test(header) ? atob(raw) : decodeURIComponent(raw)
    const vb = body.match(
      /viewBox\s*=\s*"[\d.eE+-]+[\s,]+[\d.eE+-]+[\s,]+([\d.eE+]+)[\s,]+([\d.eE+]+)"/i,
    )
    if (vb) return { w: parseFloat(vb[1] ?? '0'), h: parseFloat(vb[2] ?? '0') }
    const wm = body.match(/\bwidth\s*=\s*"([\d.]+)/i)
    const hm = body.match(/\bheight\s*=\s*"([\d.]+)/i)
    if (wm && hm) return { w: parseFloat(wm[1] ?? '0'), h: parseFloat(hm[1] ?? '0') }
  } catch {
    /* fall through */
  }
  return { w: 0, h: 0 }
}

// Cap the rasterized resolution so embedded images don't bloat the PDF; this is
// still far above the on-page display size.
const MAX_RASTER_WIDTH = 1600

/**
 * Resolve a markdown image reference to embeddable PNG bytes. Every image is
 * rasterized through a canvas so it works with react-pdf's <Image> — crucially
 * this makes SVGs render (they'd otherwise be blank) by drawing them at 2x. The
 * intrinsic size is returned so the image can be scaled to fit the page.
 */
export async function resolveImage(
  src: string,
  images: Record<string, string>,
): Promise<RasterImage | null> {
  const resolved = images[src] ?? (isAbsolute(src) ? src : null)
  if (!resolved) return null
  const svg = isSvgSource(resolved, src)
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = resolved
    })

    let width = img.naturalWidth || 0
    let height = img.naturalHeight || 0
    if (svg && (!width || !height)) {
      const box = svgSizeFromDataUrl(resolved)
      width = box.w
      height = box.h
    }
    width = width || 800
    height = height || 600

    // Rasterize: SVGs at a high resolution so they stay crisp when scaled up to
    // the full column width; raster images at native size, capped so very large
    // photos don't bloat the file.
    const targetW = svg
      ? Math.min(2400, Math.max(width * 3, 1400))
      : Math.min(width, MAX_RASTER_WIDTH)
    const targetH = Math.round(targetW * (height / width))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(targetW))
    canvas.height = Math.max(1, targetH)
    const ctx = canvas.getContext('2d')
    if (!ctx) return { dataUrl: resolved, width, height, vector: svg }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    try {
      return { dataUrl: canvas.toDataURL('image/png'), width, height, vector: svg }
    } catch {
      // Cross-origin taint: hand the URL to react-pdf to fetch itself.
      return { dataUrl: resolved, width, height, vector: svg }
    }
  } catch {
    return null
  }
}
