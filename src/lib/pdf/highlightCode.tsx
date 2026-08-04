import { Fragment, type ReactNode } from 'react'
import { Text } from '@react-pdf/renderer'
import { createLowlight, common } from 'lowlight'
import type { Root, Element, RootContent } from 'hast'
import { PDF_COLORS } from './pdfTheme'

/**
 * Syntax coloring for code blocks in the PDF. Reuses lowlight (the same
 * highlighter family as the on-screen rehype-highlight) and maps its `hljs-*`
 * classes to the app's warm code palette, emitting colored <Text> spans. Text
 * values are passed through verbatim so indentation and newlines are preserved.
 */

const lowlight = createLowlight(common)

const CLASS_COLOR: Record<string, string> = {
  'hljs-comment': PDF_COLORS.codeComment,
  'hljs-quote': PDF_COLORS.codeComment,
  'hljs-keyword': PDF_COLORS.codeKeyword,
  'hljs-selector-tag': PDF_COLORS.codeKeyword,
  'hljs-literal': PDF_COLORS.codeKeyword,
  'hljs-section': PDF_COLORS.codeKeyword,
  'hljs-name': PDF_COLORS.codeKeyword,
  'hljs-string': PDF_COLORS.codeString,
  'hljs-regexp': PDF_COLORS.codeString,
  'hljs-addition': PDF_COLORS.codeString,
  'hljs-number': PDF_COLORS.codeNumber,
  'hljs-symbol': PDF_COLORS.codeNumber,
  'hljs-bullet': PDF_COLORS.codeNumber,
  'hljs-link': PDF_COLORS.codeNumber,
  'hljs-title': PDF_COLORS.codeFunc,
  'hljs-type': PDF_COLORS.codeFunc,
  'hljs-built_in': PDF_COLORS.codeFunc,
  'hljs-attr': PDF_COLORS.codeFunc,
  'hljs-attribute': PDF_COLORS.codeFunc,
  'hljs-selector-id': PDF_COLORS.codeFunc,
  'hljs-selector-class': PDF_COLORS.codeFunc,
  'hljs-punctuation': PDF_COLORS.codePunct,
  'hljs-operator': PDF_COLORS.codePunct,
  'hljs-meta': PDF_COLORS.codePunct,
  'hljs-tag': PDF_COLORS.codePunct,
}

function classListOf(node: Element): string[] {
  const raw = node.properties?.className
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') return raw.split(/\s+/)
  return []
}

/** Flatten a hast subtree into colored spans, inheriting the nearest color. */
function walk(nodes: RootContent[], color: string, out: ReactNode[]): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push(
        <Text key={out.length} style={{ color }}>
          {node.value}
        </Text>,
      )
    } else if (node.type === 'element') {
      const cls = classListOf(node)
      const matched = cls.map((c) => CLASS_COLOR[c]).find(Boolean)
      walk(node.children, matched ?? color, out)
    }
  }
}

/**
 * Return the code as an array of colored <Text> spans. Falls back to plain
 * (uncolored) text if the language is unknown or highlighting throws.
 */
export function highlightCode(code: string, lang?: string): ReactNode {
  let tree: Root
  try {
    tree =
      lang && lowlight.registered(lang)
        ? lowlight.highlight(lang, code)
        : lowlight.highlightAuto(code)
  } catch {
    return code
  }
  const out: ReactNode[] = []
  walk(tree.children, PDF_COLORS.codeFg, out)
  return <Fragment>{out}</Fragment>
}
