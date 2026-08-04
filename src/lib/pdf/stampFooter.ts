import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { PDF_SIZES } from './pdfTheme'

// Footer color = the app's faint text token (#93918a), normalized to 0–1.
const FOOTER_COLOR = rgb(0x93 / 255, 0x91 / 255, 0x8a / 255)

/**
 * Stamp a centered "Page X of Y" footer on every page. Done as a post-process
 * with pdf-lib because react-pdf's dynamic `render` prop does not emit here; the
 * document reserves bottom padding so the footer never overlaps content.
 */
export async function stampPageNumbers(bytes: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()
  const total = pages.length

  pages.forEach((page, index) => {
    const { width } = page.getSize()
    const text = `Page ${index + 1} of ${total}`
    const size = PDF_SIZES.footer
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: 22,
      size,
      font,
      color: FOOTER_COLOR,
    })
  })

  return doc.save()
}
