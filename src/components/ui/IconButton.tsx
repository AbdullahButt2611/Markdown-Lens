import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons have no visible text, so label them. */
  'aria-label': string
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center rounded-md p-1.5 text-[color:var(--color-fg-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-fg)] disabled:cursor-not-allowed disabled:opacity-60'

export function IconButton({
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  )
}
