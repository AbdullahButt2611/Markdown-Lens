import type { ReactNode } from 'react'

interface TableWrapperProps {
  children: ReactNode
}

/**
 * Wraps GFM tables so they scroll horizontally instead of overflowing the
 * reading pane on narrow screens.
 */
export function TableWrapper({ children }: TableWrapperProps) {
  return (
    <div className="md-table-scroll my-[22px] overflow-x-auto rounded-xl border border-[color:var(--color-border)]">
      <table>{children}</table>
    </div>
  )
}
