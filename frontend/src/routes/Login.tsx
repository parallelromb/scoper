import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '../lib/cn'

export default function Login() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await login(username.trim())
      navigate('/')
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4 bg-surface-50 dark:bg-surface-950">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-agent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 mb-4">
            <Sparkles className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            ARIES
          </h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400 text-sm">
            AI-powered estimation platform
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoFocus
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm',
                  'bg-white dark:bg-surface-800/60',
                  'border border-surface-200 dark:border-surface-700',
                  'text-surface-900 dark:text-surface-100',
                  'placeholder:text-surface-400 dark:placeholder:text-surface-500',
                  'outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
                  'transition-all duration-200'
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-error-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={!username.trim() || submitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
                'bg-primary-600 hover:bg-primary-700 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 focus:ring-offset-surface-50 dark:focus:ring-offset-surface-950'
              )}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-surface-400 dark:text-surface-600 mt-6">
          No password required. First login auto-registers your account.
        </p>
      </div>
    </div>
  )
}
