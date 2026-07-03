import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import type { Element, ElementContent } from 'hast'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { CodeBlock } from './CodeBlock'
import { Anchor } from './Anchor'
import { TableWrapper } from './TableWrapper'

/**
 * The ONE place the markdown pipeline is configured (CLAUDE.md: "One pipeline").
 * The remark/rehype plugin arrays and the `components` override map live here
 * and nowhere else. Custom renderers (CodeBlock, Anchor, TableWrapper) are
 * separate files consumed through the map.
 *
 * Raw HTML is intentionally NOT enabled (no `rehype-raw`). Enabling it later
 * would REQUIRE `rehype-sanitize` in the same change (CLAUDE.md hard rule 4).
 *
 * The highlighter (rehype-highlight today) is isolated here; swapping it for
 * Shiki later would not touch the custom renderers.
 *
 * Defined at module scope so the arrays/map are stable across renders.
 */
const remarkPlugins: PluggableList = [remarkGfm, remarkMath]
const rehypePlugins: PluggableList = [
  rehypeKatex,
  [rehypeHighlight, { ignoreMissing: true }],
]

/** Flatten a hast subtree to its raw text (for the copy button). */
function hastToText(node: ElementContent): string {
  if (node.type === 'text') return node.value
  if (node.type === 'element') return node.children.map(hastToText).join('')
  return ''
}

/** Pull the language label and raw source out of a <pre>'s <code> child. */
function readCodeMeta(node: Element | undefined): {
  language?: string
  text: string
} {
  const codeEl = node?.children.find(
    (child): child is Element =>
      child.type === 'element' && child.tagName === 'code',
  )
  if (!codeEl) return { text: '' }

  const className = codeEl.properties?.['className']
  const classList = Array.isArray(className) ? className.map(String) : []
  const langClass = classList.find((c) => c.startsWith('language-'))

  return {
    language: langClass ? langClass.slice('language-'.length) : undefined,
    text: hastToText(codeEl),
  }
}

const components: Components = {
  a: Anchor,
  table: ({ children }) => <TableWrapper>{children}</TableWrapper>,
  pre: ({ node, children }) => {
    const { language, text } = readCodeMeta(node)
    return (
      <CodeBlock language={language} rawText={text}>
        {children}
      </CodeBlock>
    )
  },
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-doc prose max-w-none">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
