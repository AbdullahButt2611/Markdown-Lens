import type { MarkdownFile } from '../../types/markdown'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'

interface ReadingPaneProps {
  file: MarkdownFile
}

/**
 * The reading surface — the product's hero. Renders the active document and
 * nothing else; all state lives in owners above it.
 */
export function ReadingPane({ file }: ReadingPaneProps) {
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <MarkdownRenderer content={file.content} />
      </article>
    </div>
  )
}
