import type { MarkdownFile } from '../types/markdown'

/** File types we accept, by extension. */
export const ACCEPTED_EXTENSIONS = ['.md', '.markdown', '.txt'] as const

/** `accept` attribute for the native file picker. */
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')

/** Reject anything larger than this — a sane guard against pasting huge files. */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_FILE_SIZE_LABEL = '5 MB'

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * Validate a file's type and size. Returns an error message naming the file,
 * or `null` if the file is acceptable.
 */
export function validateFile(file: File): string | null {
  if (!hasAcceptedExtension(file.name)) {
    return `"${file.name}" isn't a supported type. Use ${ACCEPTED_EXTENSIONS.join(', ')}.`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" is larger than ${MAX_FILE_SIZE_LABEL}. Try a smaller file.`
  }
  return null
}

/** Read a validated file's text. Throws if the browser fails to read it. */
export async function readFileContent(file: File): Promise<string> {
  return file.text()
}

/**
 * Make `name` unique against `taken` by appending a counter before the
 * extension: "notes.md" -> "notes (2).md". Pure; caller supplies taken names.
 */
export function disambiguateName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name

  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''

  let counter = 2
  let candidate = `${base} (${counter})${ext}`
  while (taken.has(candidate)) {
    counter += 1
    candidate = `${base} (${counter})${ext}`
  }
  return candidate
}

/**
 * Merge already-id'd files into the existing list, disambiguating any name
 * that collides with an existing or same-batch name. Ids are preserved, so the
 * caller can select a just-added file. Returns a new array.
 */
export function appendFiles(
  existing: MarkdownFile[],
  incoming: MarkdownFile[],
): MarkdownFile[] {
  const taken = new Set(existing.map((f) => f.name))
  const merged = [...existing]

  for (const file of incoming) {
    const name = disambiguateName(file.name, taken)
    taken.add(name)
    merged.push({ ...file, name })
  }
  return merged
}
