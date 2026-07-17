import type { ImageRef } from '../types/markdown'

/** Image types accepted for the referenced-image upload flow. */
export const ACCEPTED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.avif',
  '.bmp',
] as const

/** `accept` attribute for the image file picker. */
export const IMAGE_ACCEPT_ATTR = 'image/*'

/** The file name (basename) of a path or URL, without query or hash. */
export function basename(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? path
  const parts = clean.split(/[/\\]/)
  const last = parts[parts.length - 1] ?? clean
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/** True when the file looks like a supported image (by MIME or extension). */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const lower = file.name.toLowerCase()
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** A reference is "local" if it has no URI scheme and is not a data/blob URL. */
function isLocalReference(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  // Absolute URL (http:, https:, data:, blob:, mailto:, etc.) or protocol-relative.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false
  if (trimmed.startsWith('//')) return false
  return true
}

/** Remove fenced code blocks and inline code so image syntax inside them is ignored. */
function stripCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '')
}

// Markdown image: ![alt](url "optional title"). URL may be wrapped in <>.
const IMAGE_RE = /!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g

/**
 * Scan markdown for LOCAL image references (relative paths the user must
 * supply). Absolute URLs, data/blob URLs, and images inside code blocks are
 * ignored. Results are de-duplicated by the exact reference.
 */
export function scanImageReferences(content: string): ImageRef[] {
  const text = stripCode(content)
  const seen = new Set<string>()
  const refs: ImageRef[] = []

  for (const match of text.matchAll(IMAGE_RE)) {
    let url = match[1] ?? ''
    if (url.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1)
    url = url.trim()
    if (!isLocalReference(url)) continue
    if (seen.has(url)) continue
    seen.add(url)
    refs.push({ url, name: basename(url) })
  }

  return refs
}
