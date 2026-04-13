import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  Zap,
  GitBranch,
  LayoutDashboard,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { cn } from '../../lib/cn'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/quick-estimate', label: 'Quick Estimate', icon: Zap },
  { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh flex flex-col bg-surface-50 dark:bg-surface-950">
      {/* Top Navbar */}
      <header className="glass-nav sticky top-0 z-40 h-14 flex items-center px-4 gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 no-underline shrink-0">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
            ARIES
          </span>
        </NavLink>

        {/* Center nav links (desktop) */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline',
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800/60'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: theme toggle + user */}
        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                'text-surface-600 dark:text-surface-300',
                'hover:bg-surface-100 dark:hover:bg-surface-800'
              )}
            >
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-semibold text-primary-600 dark:text-primary-400">
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="hidden sm:inline">{user?.display_name ?? user?.username}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card py-1 shadow-lg z-50">
                <div className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {user?.display_name ?? user?.username}
                  </p>
                  <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 bottom-0 w-64 z-30 glass-card rounded-none border-t-0 border-l-0 border-b-0',
          'transform transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors no-underline',
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
