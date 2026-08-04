import type { ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { useClipboard } from '../../hooks/useClipboard'

interface CodeBlockProps {
  /** Detected language label, if the fence declared one. */
  language?: string
  /** Raw source text, used for the copy button. */
  rawText: string
  /** The highlighted <code> element produced by the pipeline. */
  children: ReactNode
}

/**
 * The signature element: a fenced code block with a header bar (three dots +
 * language label + copy button) over a syntax-highlighted body. Wrapped in
 * `not-prose` so the typography plugin doesn't touch it — the block owns its
 * styling and stays dark in BOTH page themes via the constant --color-code-*
 * tokens. The highlighter is swappable (Shiki later) without changing this
 * component: it just renders whatever highlighted <code> the pipeline hands it.
 */
export function CodeBlock({ language, rawText, children }: CodeBlockProps) {
  const { copied, copy } = useClipboard()

  return (
    <div className="not-prose my-6 overflow-hidden rounded-[14px] border border-[color:var(--color-code-border)] shadow-lg">
      <div className="flex items-center justify-between border-b border-[color:var(--color-code-border)] bg-[color:var(--color-code-header-bg)] px-[14px] py-[9px]">
        <div className="flex items-center gap-[9px]">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-[9px] w-[9px] rounded-full bg-[#e0997a]" />
            <span className="h-[9px] w-[9px] rounded-full bg-[#d8a657]" />
            <span className="h-[9px] w-[9px] rounded-full bg-[#9fb07f]" />
          </span>
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-code-fg)] opacity-60">
            {language ?? 'text'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void copy(rawText)}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-[9px] py-1 font-sans text-[11.5px] font-medium text-[color:var(--color-code-fg)] transition-colors hover:bg-white/[0.08]"
        >
          {copied ? (
            <>
              <Check
                size={13}
                strokeWidth={2.4}
                aria-hidden="true"
                className="text-[color:var(--color-code-string)]"
              />
              Copied
            </>
          ) : (
            <>
              <Copy size={13} aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[color:var(--color-code-bg)] px-[18px] py-4 font-mono text-[13.5px] leading-[1.75] text-[color:var(--color-code-fg)]">
        {children}
      </pre>
    </div>
  )
}
