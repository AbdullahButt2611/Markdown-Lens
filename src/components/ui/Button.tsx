import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary:
    'bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] hover:brightness-110',
  ghost:
    'border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-muted)]',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
