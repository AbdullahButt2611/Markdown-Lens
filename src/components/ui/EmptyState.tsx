import {
  Code2,
  Image as ImageIcon,
  Lock,
  Sigma,
  Type,
  Upload,
  Workflow,
} from 'lucide-react'
import type { UploadError } from '../../types/markdown'
import type { Theme } from '../../hooks/useTheme'
import { DropZone } from '../upload/DropZone'
import { UploadErrors } from '../upload/UploadErrors'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface EmptyStateProps {
  onFiles: (files: File[]) => void
  errors: UploadError[]
  onDismissError: (id: string) => void
  theme: Theme
  onToggleTheme: () => void
}

const FEATURES = [
  { icon: Type, label: 'GitHub-Flavored Markdown' },
  { icon: Sigma, label: 'LaTeX Math' },
  { icon: Code2, label: 'Syntax Highlighting' },
  { icon: ImageIcon, label: 'Images' },
  { icon: Workflow, label: 'Mermaid Diagrams' },
] as const

/** Full-pane invitation shown when no files are open. */
export function EmptyState({
  onFiles,
  errors,
  onDismissError,
  theme,
  onToggleTheme,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-7 py-5">
        <div className="flex items-center gap-[11px]">
          <Logo size={30} iconSize={19} radius={9} />
          <span className="font-display text-[17px] font-bold tracking-[-0.02em]">
            Markdown Lens
          </span>
        </div>
        <ThemeToggle
          theme={theme}
          onToggle={onToggleTheme}
          className="h-[34px] w-[34px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
        />
      </div>

      {/* Centered invitation */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10 pt-3">
        <div className="flex w-full max-w-[600px] flex-col items-center gap-[30px]">
          <Logo size={68} iconSize={40} radius={20} className="shadow-lg" />

          <div className="text-center">
            <h1 className="font-display text-[34px] font-bold leading-[1.12] tracking-[-0.022em]">
              Read Your Markdown, Beautifully
            </h1>
            <p className="mx-auto mt-3.5 max-w-[440px] text-[14.5px] leading-[1.62] text-[color:var(--color-fg-muted)]">
              Drop in your{' '}
              <code className="rounded-[5px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-1.5 py-px font-mono text-[0.86em]">
                .md
              </code>{' '}
              files and read them rendered with Claude-like fidelity. Files stay
              in your browser, so nothing is uploaded and nothing is saved.
            </p>
          </div>

          <DropZone onFiles={onFiles} className="w-full">
            <div className="flex flex-col items-center gap-[18px] px-6 py-[54px] text-center">
              <span className="inline-flex h-[58px] w-[58px] items-center justify-center rounded-[17px] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
                <Upload size={27} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-[20px] font-semibold">
                  Drop Markdown Files Here
                </p>
                <p className="mt-2 text-[12.5px] text-[color:var(--color-fg-faint)]">
                  Or{' '}
                  <span className="font-semibold text-[color:var(--color-accent)]">
                    Browse
                  </span>{' '}
                  · .md, .markdown, .txt · Up To 5 MB Each
                </p>
              </div>
            </div>
          </DropZone>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-[7px] rounded-full border border-[color:var(--color-border)] px-[13px] py-[7px] text-[12px] text-[color:var(--color-fg-muted)]"
              >
                <Icon
                  size={13}
                  aria-hidden="true"
                  className="text-[color:var(--color-accent)]"
                />
                {label}
              </span>
            ))}
          </div>

          <UploadErrors
            errors={errors}
            onDismiss={onDismissError}
            className="w-full"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 border-t border-[color:var(--color-border)] px-4 py-[18px]">
        <Lock
          size={13}
          aria-hidden="true"
          className="shrink-0 text-[color:var(--color-fg-faint)]"
        />
        <span className="text-[11.5px] text-[color:var(--color-fg-faint)]">
          In-Memory Only · Your Files Never Leave The Browser, And There's
          Nothing To Save
        </span>
      </div>
    </div>
  )
}
