import { useContext } from 'react'
import { ImageOff } from 'lucide-react'
import { ImageMapContext } from './imageMapContext'

interface MarkdownImageProps {
  src?: string
  alt?: string
  title?: string
}

/** Absolute URL, protocol-relative, or an already-inlined data/blob URL. */
function isAbsolute(src: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(src) ||
    src.startsWith('//') ||
    src.startsWith('data:') ||
    src.startsWith('blob:')
  )
}

/**
 * Renders a markdown image. Local references resolve through the per-file image
 * map (blob URLs the user supplied); absolute URLs render directly. An
 * unresolved local reference degrades gracefully to a labelled placeholder
 * rather than a broken image.
 */
export function MarkdownImage({ src, alt, title }: MarkdownImageProps) {
  const images = useContext(ImageMapContext)
  if (!src) return null

  const resolved = images[src] ?? (isAbsolute(src) ? src : undefined)

  if (!resolved) {
    return (
      <span className="my-2 inline-flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-2 text-sm text-[color:var(--color-fg-muted)]">
        <ImageOff size={15} aria-hidden="true" />
        {alt ? alt : 'Image Not Available'}
      </span>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt ?? ''}
      title={title}
      loading="lazy"
      className="mx-auto my-6 block h-auto max-w-full rounded-lg border border-[color:var(--color-border)]"
    />
  )
}
