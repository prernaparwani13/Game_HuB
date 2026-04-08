import React, { createContext, useContext, useMemo, useState } from 'react'
import { loadJson, saveJson } from '../lib/storage'

export type ThemeMode = 'dark' | 'light'

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'mini-game-hub.theme'

function applyThemeToDom(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    loadJson<ThemeMode>(STORAGE_KEY, 'dark'),
  )

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    saveJson(STORAGE_KEY, t)
    applyThemeToDom(t)
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  // Apply once on mount (and on refresh before first render styles settle)
  React.useEffect(() => {
    applyThemeToDom(theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

