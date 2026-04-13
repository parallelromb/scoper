import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('aries-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },

  init: () => {
    const stored = localStorage.getItem('aries-theme') as Theme | null
    const theme = stored ?? 'dark'
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))
