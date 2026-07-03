import { File, Lock } from 'lucide-react'
import type { MarkdownFile } from '../../types/markdown'
import { readingTime } from '../../lib/readingTime'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'

interface ReadingPaneProps {
  file: MarkdownFile
}

/**
 * The reading surface — the product's hero. A slim header bar names the file
 * and reasserts the in-memory guarantee; below it the document scrolls. The
 * header is desktop-only: on mobile the MobileBar already carries the file name.
 */
export function ReadingPane({ file }: ReadingPaneProps) {
  return (
    <div className="flex h-full flex-col">
      <header
        className="hidden items-center gap-3 border-b border-[color:var(--color-border)] px-[26px] py-[13px] backdrop-blur-sm md:flex"
        style={{
          background: 'color-mix(in srgb, var(--color-bg) 82%, transparent)',
        }}
      >
        <File
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
          className="shrink-0 text-[color:var(--color-accent)]"
        />
        <span className="text-[13.5px] font-medium text-[color:var(--color-fg)]">
          {file.name}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-accent-soft)] px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.02em] text-[color:var(--color-accent)]">
          <Lock size={10} strokeWidth={2.4} aria-hidden="true" />
          In-memory
        </span>
        <span className="flex-1" />
        <span className="text-[11.5px] text-[color:var(--color-fg-faint)]">
          {readingTime(file.content)}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-[960px] px-5 pb-[120px] pt-[52px] sm:px-10">
          <MarkdownRenderer content={file.content} />
        </article>
      </div>
    </div>
  )
}
