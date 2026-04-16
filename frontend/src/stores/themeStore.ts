import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('scoper-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },

  init: () => {
    const stored = localStorage.getItem('scoper-theme') as Theme | null
    const theme = stored ?? 'light'
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))
