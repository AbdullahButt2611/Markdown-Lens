import { useCallback, useEffect, useRef, useState } from 'react'

interface UseClipboard {
  /** True briefly after a successful copy, for "Copied" feedback. */
  copied: boolean
  /** Copy text to the clipboard; sets `copied` on success. */
  copy: (text: string) => Promise<void>
}

/**
 * Clipboard write with transient copied-state feedback. The reset timer is
 * cleared on unmount so we never set state on an unmounted component.
 */
export function useClipboard(resetMs = 2000): UseClipboard {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), resetMs)
      } catch {
        setCopied(false)
      }
    },
    [resetMs],
  )

  return { copied, copy }
}
