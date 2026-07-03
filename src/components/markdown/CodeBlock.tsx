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
 * The signature element: a fenced code block with a header bar (language label +
 * copy button) over a syntax-highlighted body. Wrapped in `not-prose` so the
 * typography plugin doesn't touch it — the block owns its styling and stays
 * dark in BOTH page themes via the constant --color-code-* tokens. The
 * highlighter is swappable (Shiki later) without changing this component: it
 * just renders whatever highlighted <code> the pipeline hands it.
 */
export function CodeBlock({ language, rawText, children }: CodeBlockProps) {
  const { copied, copy } = useClipboard()

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-[color:var(--color-code-border)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-code-border)] bg-[color:var(--color-code-header-bg)] px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-code-fg)]/70">
          {language ?? 'text'}
        </span>
        <button
          type="button"
          onClick={() => void copy(rawText)}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[color:var(--color-code-fg)]/80 transition-colors hover:bg-white/10 hover:text-[color:var(--color-code-fg)]"
        >
          {copied ? (
            <>
              <Check size={14} aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[color:var(--color-code-bg)] px-4 py-4 text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  )
}
