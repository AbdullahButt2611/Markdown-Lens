import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode
}

/**
 * Links open in a new tab and are hardened against reverse-tabnabbing
 * (`rel="noopener noreferrer"`). Content comes from user markdown; because raw
 * HTML is disabled, `href` can only be a parsed markdown link target.
 */
export function Anchor({ children, ...props }: AnchorProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
}
