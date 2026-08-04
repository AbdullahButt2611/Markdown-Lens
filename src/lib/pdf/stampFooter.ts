import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import merriweatherBold from '../../assets/fonts/Merriweather-Bold.ttf'
import merriweatherRegular from '../../assets/fonts/Merriweather-Regular.ttf'

// Footer colors: brand name in the foreground token, page number in the faint
// token — the same roles as the app header.
const FG = rgb(0x2b / 255, 0x2a / 255, 0x26 / 255)
const FAINT = rgb(0x93 / 255, 0x91 / 255, 0x8a / 255)

const MARGIN_X = 46
const TILE = 13 // logo tile edge, in points
const TILE_Y = 14 // distance from the page bottom to the tile bottom
const NAME_SIZE = 9
const NUMBER_SIZE = 8.5

// The app logo: a coral rounded tile framing lucide's white Aperture icon —
// same mark as the sidebar header (see Logo.tsx), rendered here as an SVG.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#c15f3c"/>
  <g transform="translate(12 12) scale(1.6667)" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="14.31" y1="8" x2="20.05" y2="17.94"/>
    <line x1="9.69" y1="8" x2="21.17" y2="8"/>
    <line x1="7.38" y1="12" x2="13.12" y2="2.06"/>
    <line x1="9.69" y1="16" x2="3.95" y2="6.06"/>
    <line x1="14.31" y1="16" x2="2.83" y2="16"/>
    <line x1="16.62" y1="12" x2="10.88" y2="21.94"/>
  </g>
</svg>`

/** Rasterize the logo SVG to PNG bytes for embedding. */
async function logoPngBytes(): Promise<Uint8Array> {
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LOGO_SVG)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(img, 0, 0, 128, 128)
  const b64 = canvas.toDataURL('image/png').split(',')[1] ?? ''
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/**
 * Stamp a footer on every page — the app logo + "Markdown Lens" on the left
 * (mirroring the header) and "Page X of Y" on the right. Done as a post-process
 * with pdf-lib because react-pdf's dynamic `render` prop does not emit here; the
 * document reserves bottom padding so the footer never overlaps content.
 */
export async function stampFooter(bytes: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  doc.registerFontkit(fontkit)

  const [boldBytes, regularBytes, logoBytes] = await Promise.all([
    fetch(merriweatherBold).then((r) => r.arrayBuffer()),
    fetch(merriweatherRegular).then((r) => r.arrayBuffer()),
    logoPngBytes(),
  ])
  const nameFont = await doc.embedFont(boldBytes)
  const numberFont = await doc.embedFont(regularBytes)
  const logo = await doc.embedPng(logoBytes)

  const pages = doc.getPages()
  const total = pages.length
  const centerY = TILE_Y + TILE / 2
  const baseline = centerY - NAME_SIZE * 0.34

  pages.forEach((page, index) => {
    const { width } = page.getSize()

    // Left: logo tile + brand name.
    page.drawImage(logo, { x: MARGIN_X, y: TILE_Y, width: TILE, height: TILE })
    page.drawText('Markdown Lens', {
      x: MARGIN_X + TILE + 5,
      y: baseline,
      size: NAME_SIZE,
      font: nameFont,
      color: FG,
    })

    // Right: page number.
    const text = `Page ${index + 1} of ${total}`
    const textWidth = numberFont.widthOfTextAtSize(text, NUMBER_SIZE)
    page.drawText(text, {
      x: width - MARGIN_X - textWidth,
      y: baseline,
      size: NUMBER_SIZE,
      font: numberFont,
      color: FAINT,
    })
  })

  return doc.save()
}
