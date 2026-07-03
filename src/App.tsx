import { useCallback, useState } from 'react'
import type { MarkdownFile } from './types/markdown'
import { useFileUpload } from './hooks/useFileUpload'
import { useTheme } from './hooks/useTheme'
import { appendFiles } from './lib/file'
import { createId } from './lib/ids'
import { EmptyState } from './components/ui/EmptyState'
import { Sidebar } from './components/layout/Sidebar'
import { ReadingPane } from './components/layout/ReadingPane'
import { UploadErrors } from './components/upload/UploadErrors'

function App() {
  // Minimal state, lifted to the lowest common owner: the files and which is
  // active. Nothing is persisted — a refresh clears everything by design.
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const { errors, dismissError, readFiles } = useFileUpload()
  const { theme, toggleTheme } = useTheme()

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
    <div className="flex min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-fg)]">
      <Sidebar
        files={files}
        activeId={activeId}
        onSelect={setActiveId}
        onRemove={handleRemove}
        onFiles={handleFiles}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="relative flex-1">
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
          <div className="flex h-screen items-center justify-center text-[color:var(--color-fg-muted)]">
            Select a file to read.
          </div>
        )}
      </main>
    </div>
  )
}

export default App
