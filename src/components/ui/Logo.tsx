import { Aperture } from 'lucide-react'

interface LogoProps {
  /** Tile edge length in px. */
  size?: number
  /** Icon edge length in px. */
  iconSize?: number
  /** Tile corner radius in px. */
  radius?: number
  className?: string
}

/**
 * "Aperture Iris" mark: a coral rounded-square tile framing lucide's Aperture
 * icon in white. Used in the sidebar, the empty-state hero, and the favicon.
 */
export function Logo({
  size = 30,
  iconSize = 19,
  radius = 9,
  className = '',
}: LogoProps) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center bg-[color:var(--color-accent)] ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <Aperture size={iconSize} strokeWidth={1.7} className="text-white" />
    </span>
  )
}
