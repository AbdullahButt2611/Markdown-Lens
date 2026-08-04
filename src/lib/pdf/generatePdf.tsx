import { pdf } from '@react-pdf/renderer'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkBrToBreak } from '../remarkBrToBreak'
import { remarkMark } from '../remarkMark'
import type { MarkdownFile } from '../../types/markdown'
import { MarkdownDocument, type MdNode, type PdfAssets } from './MarkdownDocument'
import { renderDiagram, resolveImage, type RasterImage } from './assets'
import { stampFooter } from './stampFooter'
import { registerPdfFonts } from './registerFonts'

/**
 * Build a vector PDF from a markdown file — real selectable text, clickable
 * links, exact type sizes, and no clipping (react-pdf wraps to the page box).
 * Everything runs in the browser; nothing is uploaded or persisted.
 *
 * The markdown is parsed with the SAME remark plugin set the on-screen renderer
 * uses, so the structure (tables, math, <mark>, <br>) matches the reading view.
 * Diagrams and images are rasterized up front, then the document is built
 * synchronously from the tree.
 */

function parse(content: string): MdNode {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBrToBreak)
    .use(remarkMark)
  const tree = processor.runSync(processor.parse(content))
  return tree as unknown as MdNode
}

/** Walk the tree collecting mermaid sources and image references to rasterize. */
function collectAssets(
  node: MdNode,
  mermaids: Set<string>,
  imageUrls: Set<string>,
): void {
  if (node.type === 'code' && node.lang === 'mermaid' && node.value) {
    mermaids.add(node.value)
  }
  if (node.type === 'image' && node.url) imageUrls.add(node.url)
  node.children?.forEach((child) => collectAssets(child, mermaids, imageUrls))
}

export async function generatePdf(file: MarkdownFile): Promise<Blob> {
  registerPdfFonts()
  const tree = parse(file.content)

  const mermaids = new Set<string>()
  const imageUrls = new Set<string>()
  collectAssets(tree, mermaids, imageUrls)

  // Mermaid mutates shared global state, so render diagrams one at a time.
  const diagrams = new Map<string, RasterImage>()
  for (const code of mermaids) {
    const img = await renderDiagram(code)
    if (img) diagrams.set(code, img)
  }

  const images = new Map<string, RasterImage | null>()
  await Promise.all(
    [...imageUrls].map(async (url) => {
      images.set(url, await resolveImage(url, file.images ?? {}))
    }),
  )

  const assets: PdfAssets = { diagrams, images }
  const blob = await pdf(
    <MarkdownDocument tree={tree} title={file.name} assets={assets} />,
  ).toBlob()

  // Add the footer (logo + name left, page number right) to every page. Copy
  // into a fresh ArrayBuffer so the bytes are a plain BlobPart regardless of
  // pdf-lib's typed-array backing.
  const stamped = await stampFooter(await blob.arrayBuffer())
  const bytes = new Uint8Array(stamped.byteLength)
  bytes.set(stamped)
  return new Blob([bytes], { type: 'application/pdf' })
}
