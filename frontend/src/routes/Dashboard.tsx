import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Search,
  Eye,
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '../lib/cn'
import { useEstimateStore } from '../stores/estimateStore'

type ViewMode = 'command' | 'estimation'

const STATUS_COLORS: Record<string, string> = {
  draft: '#0071e3',
  complete: '#10b981',
  archived: '#86868b',
}

const PIE_COLORS = ['#0071e3', '#10b981', '#86868b', '#f59e0b']

export default function Dashboard() {
  const { estimates, listEstimates, loading } = useEstimateStore()
  const [view, setView] = useState<ViewMode>('command')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    listEstimates()
  }, [listEstimates])

  // -- Computed stats --
  const totalEstimates = estimates.length
  const avgConfidence =
    estimates.length > 0
      ? Math.round(
          estimates.reduce((s, e) => s + (e.confidence_score || 0), 0) / estimates.length,
        )
      : 0
  const totalHours = Math.round(
    estimates.reduce((s, e) => s + (e.total_effort_hours || 0), 0),
  )
  const avgCost =
    estimates.length > 0
      ? Math.round(
          estimates.reduce((s, e) => s + (e.total_cost || 0), 0) / estimates.length,
        )
      : 0

  // Status distribution for pie
  const statusCounts = estimates.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Confidence distribution for bar
  const confBuckets = [
    { range: '0-25', count: 0 },
    { range: '26-50', count: 0 },
    { range: '51-75', count: 0 },
    { range: '76-100', count: 0 },
  ]
  for (const e of estimates) {
    const c = e.confidence_score || 0
    if (c <= 25) confBuckets[0].count++
    else if (c <= 50) confBuckets[1].count++
    else if (c <= 75) confBuckets[2].count++
    else confBuckets[3].count++
  }

  // Filtered list
  const filtered = estimates.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <div className="flex bg-surface-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('command')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'command'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700',
            )}
          >
            Command Center
          </button>
          <button
            onClick={() => setView('estimation')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'estimation'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700',
            )}
          >
            Estimation
          </button>
        </div>
      </div>

      {/* Command Center view */}
      {view === 'command' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary-500/10">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                </div>
                <span className="text-xs text-surface-500 font-medium">Total Estimates</span>
              </div>
              <div className="text-3xl font-bold text-surface-900">
                {totalEstimates}
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-success-500/10">
                  <TrendingUp className="w-5 h-5 text-success-500" />
                </div>
                <span className="text-xs text-surface-500 font-medium">Avg Confidence</span>
              </div>
              <div className="text-3xl font-bold text-surface-900">
                {avgConfidence}%
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-agent-500/10">
                  <Clock className="w-5 h-5 text-agent-500" />
                </div>
                <span className="text-xs text-surface-500 font-medium">Total Hours</span>
              </div>
              <div className="text-3xl font-bold text-surface-900">
                {totalHours.toLocaleString()}
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-tool-500/10">
                  <DollarSign className="w-5 h-5 text-tool-500" />
                </div>
                <span className="text-xs text-surface-500 font-medium">Avg Cost</span>
              </div>
              <div className="text-3xl font-bold text-surface-900">
                ${avgCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status doughnut */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-surface-700 mb-4">
                Status Distribution
              </h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-surface-400 text-sm">
                  No data yet
                </div>
              )}
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-surface-500 capitalize">{entry.name}</span>
                    <span className="text-surface-400">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence distribution */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-surface-700 mb-4">
                Confidence Distribution
              </h3>
              {totalEstimates > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={confBuckets}>
                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6e6e73' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6e6e73' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0071e3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-surface-400 text-sm">
                  No data yet
                </div>
              )}
            </div>
          </div>

          {/* Recent estimates table */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200/60">
              <h3 className="text-sm font-semibold text-surface-700">
                Recent Estimates
              </h3>
            </div>
            {estimates.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200/60">
                    <th className="text-left px-5 py-2.5 text-surface-500 font-medium">Name</th>
                    <th className="text-left px-5 py-2.5 text-surface-500 font-medium">Status</th>
                    <th className="text-right px-5 py-2.5 text-surface-500 font-medium">Confidence</th>
                    <th className="text-right px-5 py-2.5 text-surface-500 font-medium">Date</th>
                    <th className="text-right px-5 py-2.5 text-surface-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.slice(0, 10).map((est) => (
                    <tr
                      key={est.id}
                      className="border-b border-surface-100/60 hover:bg-surface-50/50"
                    >
                      <td className="px-5 py-3 text-surface-900 font-medium">
                        {est.name}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                            est.status === 'complete'
                              ? 'bg-success-100 text-success-600'
                              : est.status === 'archived'
                                ? 'bg-surface-100 text-surface-500'
                                : 'bg-primary-100 text-primary-600',
                          )}
                        >
                          {est.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-surface-600">
                        {est.confidence_score != null ? `${Math.round(est.confidence_score)}%` : '--'}
                      </td>
                      <td className="px-5 py-3 text-right text-surface-500 text-xs">
                        {est.created_at ? new Date(est.created_at).toLocaleDateString() : '--'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/estimates/${est.id}`}
                          className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-12 text-center text-surface-400 text-sm">
                No estimates yet. Create one to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estimation view */}
      {view === 'estimation' && (
        <div className="space-y-6">
          {/* Search & filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search estimates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="complete">Complete</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Estimate list */}
          <div className="glass-card divide-y divide-surface-200/60">
            {loading ? (
              <div className="px-5 py-12 text-center text-surface-400 text-sm">Loading...</div>
            ) : filtered.length > 0 ? (
              filtered.map((est) => (
                <Link
                  key={est.id}
                  to={`/estimates/${est.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-50/80 transition-colors no-underline"
                >
                  <div>
                    <div className="text-sm font-medium text-surface-900">
                      {est.name}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full capitalize',
                          est.status === 'complete'
                            ? 'bg-success-100 text-success-600'
                            : est.status === 'archived'
                              ? 'bg-surface-100 text-surface-500'
                              : 'bg-primary-100 text-primary-600',
                        )}
                      >
                        {est.status}
                      </span>
                      {est.total_effort_hours && <span>{est.total_effort_hours}h</span>}
                      {est.total_cost && <span>${est.total_cost.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {est.confidence_score != null && (
                      <div className="text-sm font-medium text-surface-700">
                        {Math.round(est.confidence_score)}%
                      </div>
                    )}
                    <div className="text-xs text-surface-400 mt-0.5">
                      {est.created_at ? new Date(est.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-surface-400 text-sm">
                {search || statusFilter !== 'all' ? 'No matching estimates' : 'No estimates yet'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
