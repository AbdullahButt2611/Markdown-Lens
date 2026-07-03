import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/**
 * The ONLY value this app is permitted to persist (CLAUDE.md hard rule 3).
 * It contains zero user content — just the string "light" or "dark".
 */
const STORAGE_KEY = 'markdown-lens-theme'

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function getInitialTheme(): Theme {
  const stored = readStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

interface UseTheme {
  theme: Theme
  toggleTheme: () => void
}

/** Owns the theme: applies the `.dark` class swap and persists the preference. */
export function useTheme(): UseTheme {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persistence is a nicety; ignore storage failures (e.g. private mode).
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
