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
    <div className="my-6 overflow-x-auto">
      <table>{children}</table>
    </div>
  )
}
