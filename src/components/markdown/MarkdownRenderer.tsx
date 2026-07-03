import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import remarkGfm from 'remark-gfm'

/**
 * The ONE place the markdown pipeline is configured (CLAUDE.md: "One pipeline").
 * The remark/rehype plugin arrays and the `components` override map live here
 * and nowhere else. Custom renderers (CodeBlock, Anchor, TableWrapper) are
 * separate files consumed through the map — they arrive in Phase 3.
 *
 * Raw HTML is intentionally NOT enabled (no `rehype-raw`). Enabling it later
 * would REQUIRE `rehype-sanitize` in the same change (CLAUDE.md hard rule 4).
 *
 * Defined at module scope so the arrays/map are stable across renders.
 */
const remarkPlugins: PluggableList = [remarkGfm]

// Phase 3 adds remark-math, rehype-katex, and rehype-highlight here.
const rehypePlugins: PluggableList = []

// Phase 3 populates this with CodeBlock / Anchor / TableWrapper.
const components: Components = {}

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
