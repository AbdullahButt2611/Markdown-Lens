import { type ReactNode } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Link,
  Image,
  StyleSheet,
  Svg,
  Path,
} from '@react-pdf/renderer'
import { PDF_COLORS as C, PDF_SIZES as S, PX_TO_PT } from './pdfTheme'
import { highlightCode } from './highlightCode'
import type { RasterImage } from './assets'

/**
 * Minimal structural view of the mdast nodes we render — mirrors the loose-node
 * approach in remarkMark, so we can walk math/mark nodes (not in mdast's core
 * types) without leaning on `any`.
 */
export interface MdNode {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  start?: number | null
  checked?: boolean | null
  lang?: string | null
  url?: string
  alt?: string | null
  align?: Array<'left' | 'right' | 'center' | null>
  children?: MdNode[]
}

/** Rasterized assets resolved before the document is built. */
export interface PdfAssets {
  /** Mermaid source → rendered image. */
  diagrams: Map<string, RasterImage>
  /** Image reference → resolved image (null = unavailable). */
  images: Map<string, RasterImage | null>
}

// A4 minus horizontal padding — the usable content width in points.
const PAGE_PADDING_X = 46
const CONTENT_WIDTH = 595.28 - PAGE_PADDING_X * 2

// Reading face (Merriweather) for the document body, Poppins for UI chrome
// (tables, code header), JetBrains Mono for code — same roles as on screen.
const READING = 'Merriweather'
const UI = 'Poppins'
const MONO = 'JetBrains Mono'

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: PAGE_PADDING_X,
    fontFamily: READING,
    fontSize: S.normal,
    lineHeight: 1.7,
    color: C.fg,
  },
  h1: { fontFamily: READING, fontSize: S.h1, fontWeight: 700, lineHeight: 1.2, marginBottom: 5 },
  h2: { fontFamily: READING, fontSize: S.h2, fontWeight: 700, lineHeight: 1.2, marginTop: 14, marginBottom: 5 },
  h3: { fontFamily: READING, fontSize: S.h3, fontWeight: 700, lineHeight: 1.25, marginTop: 12, marginBottom: 4 },
  h4: { fontFamily: READING, fontSize: S.h4, fontWeight: 700, lineHeight: 1.25, marginTop: 10, marginBottom: 4 },
  h5: { fontFamily: READING, fontSize: S.h5, fontWeight: 700, lineHeight: 1.3, marginTop: 9, marginBottom: 3 },
  h6: { fontFamily: READING, fontSize: S.h6, fontWeight: 700, lineHeight: 1.3, marginTop: 9, marginBottom: 3, color: C.muted },
  paragraph: { marginBottom: 8 },
  bold: { fontWeight: 700 },
  italic: { fontStyle: 'italic' },
  strike: { textDecoration: 'line-through' },
  // Links: coral, no underline — matches the reading view's link treatment.
  link: { color: C.accent, fontWeight: 500, textDecoration: 'none' },
  inlineCode: {
    fontFamily: MONO,
    fontSize: S.small,
    color: C.fg,
    backgroundColor: C.surfaceMuted,
  },
  mark: { backgroundColor: C.markBg, color: C.markFg },
  inlineMath: { fontFamily: MONO, fontSize: S.small },
  mathBlock: { fontFamily: MONO, fontSize: S.small, marginVertical: 6, textAlign: 'center' },
  imageAlt: { fontFamily: UI, fontSize: S.small, color: C.muted, fontStyle: 'italic', marginVertical: 4 },
  // Signature code block: rounded, dark, with a header bar (three dots + label).
  codeBlock: {
    borderWidth: 1,
    borderColor: C.codeBorder,
    borderRadius: 12,
    marginVertical: 10,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.codeHeaderBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  codeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  codeLang: {
    fontFamily: UI,
    fontSize: 7,
    fontWeight: 600,
    color: C.codeLabel,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 6,
  },
  codeBody: {
    backgroundColor: C.codeBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  codeText: { fontFamily: MONO, fontSize: S.code, color: C.codeFg, lineHeight: 1.6 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    paddingLeft: 14,
    marginVertical: 8,
    color: C.muted,
    fontStyle: 'italic',
  },
  hr: { borderTopWidth: 1, borderTopColor: C.border, marginVertical: 14 },
  list: { marginVertical: 6, paddingLeft: 4 },
  listItemRow: { flexDirection: 'row', marginBottom: 4 },
  listMarker: { width: 16, color: C.accent },
  listItemContent: { flex: 1 },
  listParagraph: { marginBottom: 2 },
  // GFM task-list checkbox, drawn (not a glyph) so it can't render as tofu.
  checkboxCell: { width: 16, flexDirection: 'row' },
  checkbox: {
    width: 9,
    height: 9,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: C.faint,
    marginTop: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: C.accent, borderColor: C.accent },
  imagePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.surfaceMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  imagePlaceholderText: { fontFamily: UI, fontSize: S.small, color: C.muted },
  // Tables: Poppins, rounded border, header fill, horizontal separators only.
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    marginVertical: 10,
  },
  tableRow: { flexDirection: 'row' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: C.surfaceMuted },
  cell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  cellText: { fontFamily: UI, fontSize: S.small, lineHeight: 1.45 },
  cellHeaderText: { fontFamily: UI, fontSize: S.small, fontWeight: 600, lineHeight: 1.45 },
  diagramWrap: { alignItems: 'center', marginVertical: 8 },
  imageWrap: { alignItems: 'center', marginVertical: 10 },
  image: { borderRadius: 8, borderWidth: 1, borderColor: C.border },
})

const CODE_DOTS = [C.dotRed, C.dotAmber, C.dotGreen]

const HEADINGS = [styles.h1, styles.h2, styles.h3, styles.h4, styles.h5, styles.h6]

/** Scale an image's intrinsic pixel size to points, capped at the page width. */
function fit(img: RasterImage): { width: number; height: number } {
  let width = img.width * PX_TO_PT
  let height = img.height * PX_TO_PT
  if (width > CONTENT_WIDTH) {
    height *= CONTENT_WIDTH / width
    width = CONTENT_WIDTH
  }
  return { width, height }
}

/** Render phrasing (inline) content into strings / <Text> / <Link>. */
function renderInline(nodes: MdNode[] | undefined): ReactNode {
  if (!nodes) return null
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return n.value
      case 'strong':
        return <Text key={i} style={styles.bold}>{renderInline(n.children)}</Text>
      case 'emphasis':
        return <Text key={i} style={styles.italic}>{renderInline(n.children)}</Text>
      case 'delete':
        return <Text key={i} style={styles.strike}>{renderInline(n.children)}</Text>
      case 'inlineCode':
        return <Text key={i} style={styles.inlineCode}>{n.value}</Text>
      case 'mark':
        return <Text key={i} style={styles.mark}>{renderInline(n.children)}</Text>
      case 'link':
        return (
          <Link key={i} src={n.url ?? ''} style={styles.link}>
            {renderInline(n.children)}
          </Link>
        )
      case 'inlineMath':
        return <Text key={i} style={styles.inlineMath}>{n.value}</Text>
      case 'break':
        return <Text key={i}>{'\n'}</Text>
      case 'image':
        return n.alt ? <Text key={i} style={styles.imageAlt}>[{n.alt}]</Text> : null
      default:
        return n.children ? <Text key={i}>{renderInline(n.children)}</Text> : n.value ?? null
    }
  })
}

function renderImageBlock(node: MdNode, key: number, assets: PdfAssets): ReactNode {
  const img = node.url ? assets.images.get(node.url) : null
  if (!img) {
    return (
      <View key={key} style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>
          {node.alt ? node.alt : 'Image not available'}
        </Text>
      </View>
    )
  }
  const size = fit(img)
  return (
    <View key={key} style={styles.imageWrap}>
      <Image src={img.dataUrl} style={[styles.image, size]} />
    </View>
  )
}

function renderDiagramBlock(code: string, key: number, assets: PdfAssets): ReactNode {
  const img = assets.diagrams.get(code)
  if (!img) return renderCodeBlock({ type: 'code', value: code }, key)
  const size = fit(img)
  return (
    <View key={key} style={styles.diagramWrap}>
      <Image src={img.dataUrl} style={size} />
    </View>
  )
}

function renderCodeBlock(node: MdNode, key: number): ReactNode {
  return (
    <View key={key} style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <View style={{ flexDirection: 'row' }}>
          {CODE_DOTS.map((color, i) => (
            <View key={i} style={[styles.codeDot, { backgroundColor: color }]} />
          ))}
        </View>
        <Text style={styles.codeLang}>{node.lang || 'text'}</Text>
      </View>
      <View style={styles.codeBody}>
        <Text style={styles.codeText}>
          {highlightCode(node.value ?? '', node.lang ?? undefined)}
        </Text>
      </View>
    </View>
  )
}

/** List-item body: paragraphs render tight (no block margin); nested lists and
 *  other blocks fall through to the normal block renderer. */
function renderListItemContent(item: MdNode, assets: PdfAssets): ReactNode[] {
  return (item.children ?? []).map((child, ci) =>
    child.type === 'paragraph' ? (
      <Text key={ci} style={styles.listParagraph}>
        {renderInline(child.children)}
      </Text>
    ) : (
      <View key={ci}>{renderBlocks([child], assets)}</View>
    ),
  )
}

function renderList(node: MdNode, key: number, assets: PdfAssets): ReactNode {
  const ordered = node.ordered
  const start = node.start ?? 1
  return (
    <View key={key} style={styles.list}>
      {(node.children ?? []).map((item, idx) => {
        const isTask = item.checked === true || item.checked === false
        return (
          <View key={idx} style={styles.listItemRow}>
            {isTask ? (
              <View style={styles.checkboxCell}>
                <View
                  style={[
                    styles.checkbox,
                    ...(item.checked ? [styles.checkboxChecked] : []),
                  ]}
                >
                  {item.checked ? (
                    <Svg width={6} height={6} viewBox="0 0 24 24">
                      <Path
                        d="M20 6 L9 17 L4 12"
                        stroke="#ffffff"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                  ) : null}
                </View>
              </View>
            ) : (
              <Text style={styles.listMarker}>
                {ordered ? `${start + idx}.` : '•'}
              </Text>
            )}
            <View style={styles.listItemContent}>
              {renderListItemContent(item, assets)}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function renderTable(node: MdNode, key: number): ReactNode {
  const rows = node.children ?? []
  const align = node.align ?? []
  return (
    <View key={key} style={styles.table}>
      {rows.map((row, ri) => (
        <View key={ri} style={ri === 0 ? styles.tableHeaderRow : styles.tableRow} wrap={false}>
          {(row.children ?? []).map((cell, ci) => (
            <View key={ci} style={styles.cell}>
              <Text style={[ri === 0 ? styles.cellHeaderText : styles.cellText, { textAlign: align[ci] ?? 'left' }]}>
                {renderInline(cell.children)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

/** Render block-level content. */
function renderBlocks(nodes: MdNode[] | undefined, assets: PdfAssets): ReactNode[] {
  if (!nodes) return []
  return nodes.map((n, i): ReactNode => {
    switch (n.type) {
      case 'heading': {
        const style = HEADINGS[(n.depth ?? 1) - 1] ?? styles.h6
        return <Text key={i} style={style}>{renderInline(n.children)}</Text>
      }
      case 'paragraph': {
        const kids = n.children ?? []
        const only = kids.length === 1 ? kids[0] : undefined
        if (only && only.type === 'image') {
          return renderImageBlock(only, i, assets)
        }
        return <Text key={i} style={styles.paragraph}>{renderInline(kids)}</Text>
      }
      case 'list':
        return renderList(n, i, assets)
      case 'blockquote':
        return <View key={i} style={styles.blockquote}>{renderBlocks(n.children, assets)}</View>
      case 'code':
        return n.lang === 'mermaid'
          ? renderDiagramBlock(n.value ?? '', i, assets)
          : renderCodeBlock(n, i)
      case 'table':
        return renderTable(n, i)
      case 'thematicBreak':
        return <View key={i} style={styles.hr} />
      case 'math':
        return <Text key={i} style={styles.mathBlock}>{n.value}</Text>
      case 'image':
        return renderImageBlock(n, i, assets)
      case 'html':
        return null
      default:
        return n.children ? <View key={i}>{renderBlocks(n.children, assets)}</View> : null
    }
  })
}

interface MarkdownDocumentProps {
  tree: MdNode
  title: string
  assets: PdfAssets
}

/** The react-pdf document: one flowing A4 page stream with a page-number footer. */
export function MarkdownDocument({ tree, title, assets }: MarkdownDocumentProps) {
  return (
    <Document title={title}>
      {/* The page-number footer is stamped afterwards with pdf-lib (see
          generatePdf): react-pdf's dynamic `render` prop does not emit here, and
          the bottom padding above reserves space for it. */}
      <Page size="A4" style={styles.page}>
        {renderBlocks(tree.children, assets)}
      </Page>
    </Document>
  )
}
