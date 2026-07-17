import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import type { Element, ElementContent } from 'hast'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { remarkBrToBreak } from '../../lib/remarkBrToBreak'
import { remarkMark } from '../../lib/remarkMark'
import { CodeBlock } from './CodeBlock'
import { Anchor } from './Anchor'
import { TableWrapper } from './TableWrapper'
import { MarkdownImage } from './MarkdownImage'
import { MermaidDiagram } from './MermaidDiagram'
import { ImageMapContext } from './imageMapContext'

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
const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkBrToBreak,
  remarkMark,
]
const rehypePlugins: PluggableList = [
  rehypeKatex,
  // `detect` auto-guesses the language for fences with no language tag, so
  // untagged code blocks still get syntax colors. `ignoreMissing` keeps an
  // unknown explicit language from throwing (it just renders unhighlighted).
  [rehypeHighlight, { detect: true, ignoreMissing: true }],
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
  img: ({ src, alt, title }) => (
    <MarkdownImage
      src={typeof src === 'string' ? src : undefined}
      alt={alt}
      title={title}
    />
  ),
  table: ({ children }) => <TableWrapper>{children}</TableWrapper>,
  // Cell content is wrapped so a max width can actually cap the column (a
  // max-width on the cell itself is ignored in auto table layout).
  th: ({ children, node: _node, ...rest }) => (
    <th {...rest}>
      <div className="md-cell">{children}</div>
    </th>
  ),
  td: ({ children, node: _node, ...rest }) => (
    <td {...rest}>
      <div className="md-cell">{children}</div>
    </td>
  ),
  pre: ({ node, children }) => {
    const { language, text } = readCodeMeta(node)
    // A ```mermaid fence renders as a diagram, not a code block.
    if (language === 'mermaid') {
      return <MermaidDiagram code={text} />
    }
    return (
      <CodeBlock language={language} rawText={text}>
        {children}
      </CodeBlock>
    )
  },
}

interface MarkdownRendererProps {
  content: string
  /** Resolved local images: markdown reference -> blob URL. */
  images?: Record<string, string>
}

export function MarkdownRenderer({
  content,
  images = {},
}: MarkdownRendererProps) {
  return (
    <div className="prose-doc prose max-w-none">
      <ImageMapContext.Provider value={images}>
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </ImageMapContext.Provider>
    </div>
  )
}
