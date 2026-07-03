import { useCallback, useState } from 'react'
import type { MarkdownFile, UploadError } from '../types/markdown'
import { createId } from '../lib/ids'
import { readFileContent, validateFile } from '../lib/file'

/** The parsed, valid portion of an upload (name + content, pre-id). */
type ParsedFile = Pick<MarkdownFile, 'name' | 'content'>

interface UseFileUpload {
  /** Transient list of rejected/failed uploads to surface inline. */
  errors: UploadError[]
  /** Remove one error from the list (user dismissed it). */
  dismissError: (id: string) => void
  /** Clear all errors. */
  clearErrors: () => void
  /**
   * Validate and read the given files. Invalid or unreadable files are pushed
   * to `errors`; the valid ones are returned for the caller to add to state.
   */
  readFiles: (files: File[]) => Promise<ParsedFile[]>
}

export function useFileUpload(): UseFileUpload {
  const [errors, setErrors] = useState<UploadError[]>([])

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearErrors = useCallback(() => setErrors([]), [])

  const readFiles = useCallback(async (files: File[]): Promise<ParsedFile[]> => {
    const parsed: ParsedFile[] = []
    const newErrors: UploadError[] = []

    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        newErrors.push({
          id: createId(),
          fileName: file.name,
          message: validationError,
        })
        continue
      }

      try {
        const content = await readFileContent(file)
        parsed.push({ name: file.name, content })
      } catch {
        newErrors.push({
          id: createId(),
          fileName: file.name,
          message: `Couldn't read "${file.name}". The file may be corrupted; try re-selecting it.`,
        })
      }
    }

    if (newErrors.length > 0) {
      setErrors((prev) => [...prev, ...newErrors])
    }
    return parsed
  }, [])

  return { errors, dismissError, clearErrors, readFiles }
}
