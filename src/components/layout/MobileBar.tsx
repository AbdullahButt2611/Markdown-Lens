import { Menu } from 'lucide-react'
import type { Theme } from '../../hooks/useTheme'
import type { PdfExportStatus } from '../../hooks/usePdfExport'
import { IconButton } from '../ui/IconButton'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ExportPdfButton } from '../ui/ExportPdfButton'

interface MobileBarProps {
  activeName: string | null
  onOpenSidebar: () => void
  theme: Theme
  onToggleTheme: () => void
  pdfStatus: PdfExportStatus
  pdfBusy: boolean
  /** Whether a document is open to export. */
  canExport: boolean
  onExport: () => void
}

/**
 * Top bar shown only below `md`, where the sidebar is an off-canvas drawer.
 * Opens the drawer, names the current file, and carries the export + theme
 * controls.
 */
export function MobileBar({
  activeName,
  onOpenSidebar,
  theme,
  onToggleTheme,
  pdfStatus,
  pdfBusy,
  canExport,
  onExport,
}: MobileBarProps) {
  return (
    <header className="flex items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 md:hidden">
      <IconButton aria-label="Open file list" onClick={onOpenSidebar}>
        <Menu size={20} aria-hidden="true" />
      </IconButton>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {activeName ?? 'Markdown Lens'}
      </span>
      {canExport && (
        <ExportPdfButton
          status={pdfStatus}
          disabled={pdfBusy}
          onClick={onExport}
        />
      )}
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  )
}
