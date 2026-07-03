import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../../hooks/useTheme'
import { IconButton } from './IconButton'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
  className?: string
}

/** Controlled light/dark switch. State is owned by useTheme in App. */
export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  return (
    <IconButton
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      onClick={onToggle}
      className={className}
    >
      {isDark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </IconButton>
  )
}
