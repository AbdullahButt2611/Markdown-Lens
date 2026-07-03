import { useCallback, useEffect, useState } from 'react'
import type { MarkdownFile } from './types/markdown'
import { useFileUpload } from './hooks/useFileUpload'
import { useTheme } from './hooks/useTheme'
import { appendFiles } from './lib/file'
import { createId } from './lib/ids'
import { EmptyState } from './components/ui/EmptyState'
import { Sidebar } from './components/layout/Sidebar'
import { MobileBar } from './components/layout/MobileBar'
import { ReadingPane } from './components/layout/ReadingPane'
import { UploadErrors } from './components/upload/UploadErrors'

function App() {
  // Minimal state, lifted to the lowest common owner: the files and which is
  // active. Nothing is persisted — a refresh clears everything by design.
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { errors, dismissError, readFiles } = useFileUpload()
  const { theme, toggleTheme } = useTheme()

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  const handleFiles = useCallback(
    async (input: File[]) => {
      const parsed = await readFiles(input)
      if (parsed.length === 0) return

      const withIds: MarkdownFile[] = parsed.map((p) => ({
        id: createId(),
        name: p.name,
        content: p.content,
      }))

      setFiles((prev) => appendFiles(prev, withIds))
      // Focus the first newly added file only if nothing is active yet.
      const [first] = withIds
      setActiveId((current) => current ?? first?.id ?? null)
    },
    [readFiles],
  )

  const handleSelect = useCallback((id: string) => {
    setActiveId(id)
    setSidebarOpen(false) // dismiss the drawer after picking a file on mobile
  }, [])

  const handleRemove = useCallback(
    (id: string) => {
      const index = files.findIndex((f) => f.id === id)
      const next = files.filter((f) => f.id !== id)
      setFiles(next)

      if (activeId === id) {
        const neighbor = next[Math.min(index, next.length - 1)]
        setActiveId(neighbor ? neighbor.id : null)
      }
    },
    [files, activeId],
  )

  const activeFile = files.find((f) => f.id === activeId) ?? null

  if (files.length === 0) {
    return (
      <main className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-fg)]">
        <EmptyState
          onFiles={handleFiles}
          errors={errors}
          onDismissError={dismissError}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </main>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-fg)]">
      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      <Sidebar
        files={files}
        activeId={activeId}
        onSelect={handleSelect}
        onRemove={handleRemove}
        onFiles={handleFiles}
        theme={theme}
        onToggleTheme={toggleTheme}
        onClose={closeSidebar}
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <MobileBar
          activeName={activeFile?.name ?? null}
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="relative min-h-0 flex-1">
          {errors.length > 0 && (
            <UploadErrors
              errors={errors}
              onDismiss={dismissError}
              className="absolute right-4 top-4 z-10 max-w-sm"
            />
          )}
          {activeFile ? (
            <ReadingPane file={activeFile} />
          ) : (
            <div className="flex flex-1 items-center justify-center py-24 text-[color:var(--color-fg-muted)]">
              Select A File To Read.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
