import { AlertTriangle, Check, Loader2 } from 'lucide-react'
import type { PdfExportStatus } from '../../hooks/usePdfExport'
import { PdfIcon } from './icons/PdfIcon'

interface ExportPdfButtonProps {
  status: PdfExportStatus
  disabled?: boolean
  onClick: () => void
  className?: string
}

// Styled like the "In-Memory" pill (accent-soft fill, accent text) but a
// rectangle rather than a full pill, and interactive: it deepens toward solid
// accent on hover.
const base =
  'inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-[color:var(--color-accent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_16%,transparent)] disabled:cursor-not-allowed disabled:opacity-70'

/**
 * Triggers a client-side PDF export of the active document and reflects the
 * export lifecycle (preparing → generating → done/error). Icon-plus-label so the
 * action reads clearly; the label collapses to icon-only on very small screens.
 */
export function ExportPdfButton({
  status,
  disabled,
  onClick,
  className = '',
}: ExportPdfButtonProps) {
  const busy = status === 'generating'

  const content = (() => {
    switch (status) {
      case 'generating':
        return { icon: <Loader2 size={14} className="animate-spin" aria-hidden="true" />, label: 'Generating' }
      case 'done':
        return {
          icon: <Check size={14} strokeWidth={2.6} aria-hidden="true" />,
          label: 'Saved',
        }
      case 'error':
        return {
          icon: <AlertTriangle size={14} aria-hidden="true" />,
          label: 'Failed',
        }
      default:
        return { icon: <PdfIcon size={15} aria-hidden="true" />, label: 'PDF' }
    }
  })()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={busy ? 'Generating PDF' : 'Download as PDF'}
      className={`${base} ${className}`}
    >
      {content.icon}
      <span>{content.label}</span>
    </button>
  )
}
