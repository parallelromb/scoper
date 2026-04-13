import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload, GitBranch, RefreshCw, Clock, BarChart3, TrendingUp } from 'lucide-react'
import { cn } from '../lib/cn'
import { useEstimateStore } from '../stores/estimateStore'

const modes = [
  {
    title: 'Quick Estimate',
    description: 'Upload a document and get an estimate in minutes',
    icon: Upload,
    to: '/quick-estimate',
    color: 'text-primary-500',
    bg: 'bg-primary-500/10',
    border: 'hover:border-primary-300 dark:hover:border-primary-600',
  },
  {
    title: 'Build Estimate',
    description: 'Configure a custom pipeline with drag-and-drop',
    icon: GitBranch,
    to: '/pipeline',
    color: 'text-agent-500',
    bg: 'bg-agent-500/10',
    border: 'hover:border-agent-300 dark:hover:border-agent-600',
  },
  {
    title: 'Update Existing',
    description: 'Browse and refine existing estimates',
    icon: RefreshCw,
    to: '/dashboard',
    color: 'text-success-500',
    bg: 'bg-success-500/10',
    border: 'hover:border-success-400 dark:hover:border-success-600',
  },
]

export default function Home() {
  const { estimates, listEstimates } = useEstimateStore()

  useEffect(() => {
    listEstimates()
  }, [listEstimates])

  const recent = estimates.slice(0, 5)
  const totalEstimates = estimates.length
  const avgConfidence =
    estimates.length > 0
      ? estimates.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / estimates.length
      : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
          Welcome to ARIES
        </h1>
        <p className="mt-3 text-surface-500 dark:text-surface-400">
          Choose how you want to create your estimate
        </p>
      </div>

      {/* Mode selector cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {modes.map((mode) => (
          <Link
            key={mode.to}
            to={mode.to}
            className={cn(
              'glass-card p-6 group',
              'hover:scale-[1.02] transition-all duration-200',
              'text-left no-underline',
              mode.border,
            )}
          >
            <div
              className={cn(
                'inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4',
                mode.bg,
              )}
            >
              <mode.icon className={cn('w-6 h-6', mode.color)} />
            </div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              {mode.title}
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {mode.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10">
            <BarChart3 className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900 dark:text-white">
              {totalEstimates}
            </div>
            <div className="text-xs text-surface-500 dark:text-surface-400">
              Total Estimates
            </div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success-500/10">
            <TrendingUp className="w-5 h-5 text-success-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900 dark:text-white">
              {avgConfidence > 0 ? `${Math.round(avgConfidence)}%` : '--'}
            </div>
            <div className="text-xs text-surface-500 dark:text-surface-400">
              Avg Confidence
            </div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2 rounded-lg bg-agent-500/10">
            <Clock className="w-5 h-5 text-agent-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900 dark:text-white">
              {estimates.reduce((s, e) => s + (e.total_effort_hours || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-surface-500 dark:text-surface-400">
              Total Hours
            </div>
          </div>
        </div>
      </div>

      {/* Recent estimates */}
      {recent.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
            Recent Estimates
          </h3>
          <div className="glass-card divide-y divide-surface-200/60 dark:divide-surface-700/40">
            {recent.map((est) => (
              <Link
                key={est.id}
                to={`/estimates/${est.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors no-underline"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      est.status === 'complete'
                        ? 'bg-success-500'
                        : est.status === 'archived'
                          ? 'bg-surface-400'
                          : 'bg-primary-500',
                    )}
                  />
                  <span className="text-sm font-medium text-surface-900 dark:text-white">
                    {est.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-surface-400">
                  {est.confidence_score != null && (
                    <span>{Math.round(est.confidence_score)}% confidence</span>
                  )}
                  {est.created_at && (
                    <span>{new Date(est.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
