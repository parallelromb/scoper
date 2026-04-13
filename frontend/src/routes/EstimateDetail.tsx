import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Clock,
  Calendar,
  DollarSign,
  Layers,
  ArrowLeft,
  Edit,
  AlertTriangle,
  History,
  FileText,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useEstimateStore, type Estimate } from '../stores/estimateStore'

type Tab = 'summary' | 'phases' | 'resources' | 'costs' | 'risks' | 'timeline' | 'versions' | 'audit'

const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'phases', label: 'Phases' },
  { key: 'resources', label: 'Resources' },
  { key: 'costs', label: 'Costs' },
  { key: 'risks', label: 'Risks' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'versions', label: 'Versions' },
  { key: 'audit', label: 'Audit' },
]

interface Version {
  id: number
  version: number
  change_summary: string
  created_at: string
  data?: Record<string, unknown>
}

interface AuditEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  details?: Record<string, unknown>
  created_at: string
}

export default function EstimateDetail() {
  const { id } = useParams()
  const { loadEstimate, currentEstimate, loading } = useEstimateStore()
  const [tab, setTab] = useState<Tab>('summary')
  const [versions, setVersions] = useState<Version[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])

  useEffect(() => {
    if (id) {
      loadEstimate(Number(id))
      // Load versions
      fetch(`/api/v2/estimates/${id}/versions`)
        .then((r) => r.json())
        .then(setVersions)
        .catch(() => {})
      // Load audit
      fetch(`/api/v2/audit?entity_type=estimate&entity_id=${id}`)
        .then((r) => r.json())
        .then(setAuditLog)
        .catch(() => {})
    }
  }, [id, loadEstimate])

  const est: Estimate | null = currentEstimate

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-surface-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (!est) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 text-center">
          <p className="text-surface-500">Estimate not found</p>
          <Link to="/dashboard" className="text-primary-500 text-sm mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const statusColor =
    est.status === 'complete'
      ? 'bg-success-100 text-success-600'
      : est.status === 'archived'
        ? 'bg-surface-100 text-surface-500'
        : 'bg-primary-100 text-primary-600'

  const confidenceColor =
    (est.confidence_score || 0) >= 75
      ? 'bg-success-500'
      : (est.confidence_score || 0) >= 50
        ? 'bg-tool-500'
        : 'bg-error-500'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900">
              {est.name}
            </h1>
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', statusColor)}>
              {est.status}
            </span>
          </div>
        </div>
        <Link
          to={`/update-estimate/${id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-300 text-surface-700 hover:bg-surface-50 transition-colors text-sm font-medium"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Link>
      </div>

      {/* Confidence meter */}
      {est.confidence_score != null && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-700">
              Confidence
            </span>
            <span className="text-sm font-bold text-surface-900">
              {Math.round(est.confidence_score)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', confidenceColor)}
              style={{ width: `${est.confidence_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary-500" />
          <div>
            <div className="text-xl font-bold text-surface-900">
              {est.total_effort_hours?.toLocaleString() || '--'}
            </div>
            <div className="text-xs text-surface-500">Hours</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-agent-500" />
          <div>
            <div className="text-xl font-bold text-surface-900">
              {est.total_effort_hours ? `${Math.ceil(est.total_effort_hours / 160)}mo` : '--'}
            </div>
            <div className="text-xs text-surface-500">Duration</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-success-500" />
          <div>
            <div className="text-xl font-bold text-surface-900">
              {est.total_cost ? `$${est.total_cost.toLocaleString()}` : '--'}
            </div>
            <div className="text-xs text-surface-500">Cost</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Layers className="w-5 h-5 text-tool-500" />
          <div>
            <div className="text-xl font-bold text-surface-900">
              {(est.phases as unknown[])?.length || 0}
            </div>
            <div className="text-xs text-surface-500">Phases</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              tab === t.key
                ? 'bg-primary-500 text-white'
                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass-card p-6">
        {tab === 'summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-surface-500">Status:</span>
                <span className="ml-2 text-surface-900 capitalize">{est.status}</span>
              </div>
              <div>
                <span className="text-surface-500">Source:</span>
                <span className="ml-2 text-surface-900">{est.source_document || 'N/A'}</span>
              </div>
              <div>
                <span className="text-surface-500">Created:</span>
                <span className="ml-2 text-surface-900">
                  {est.created_at ? new Date(est.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-surface-500">Updated:</span>
                <span className="ml-2 text-surface-900">
                  {est.updated_at ? new Date(est.updated_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
            {est.assumptions && (est.assumptions as string[]).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-700 mb-2">
                  Assumptions
                </h3>
                <ul className="space-y-1 text-sm text-surface-600">
                  {(est.assumptions as string[]).map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-surface-300 mt-1">-</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === 'phases' && (
          <div>
            {est.phases && (est.phases as unknown[]).length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 text-surface-500 font-medium">Phase</th>
                    <th className="text-right py-2 text-surface-500 font-medium">Hours</th>
                    <th className="text-right py-2 text-surface-500 font-medium">Cost</th>
                    <th className="text-right py-2 text-surface-500 font-medium">Resources</th>
                  </tr>
                </thead>
                <tbody>
                  {(est.phases as Array<{ name: string; hours: number; cost: number; resources: number; description?: string }>).map((p, i) => (
                    <tr key={i} className="border-b border-surface-100">
                      <td className="py-2.5 text-surface-900">
                        {p.name}
                        {p.description && (
                          <div className="text-xs text-surface-400 mt-0.5">{p.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-surface-700">{p.hours}</td>
                      <td className="py-2.5 text-right text-surface-700">${p.cost?.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-surface-700">{p.resources}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-surface-400 text-sm">No phases defined</p>
            )}
          </div>
        )}

        {tab === 'resources' && (
          <div>
            {est.resources && (est.resources as unknown[]).length > 0 ? (
              <pre className="text-sm text-surface-700 whitespace-pre-wrap">
                {JSON.stringify(est.resources, null, 2)}
              </pre>
            ) : (
              <p className="text-surface-400 text-sm">No resources defined</p>
            )}
          </div>
        )}

        {tab === 'costs' && (
          <div>
            {est.costs && (est.costs as unknown[]).length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 text-surface-500 font-medium">Category</th>
                    <th className="text-right py-2 text-surface-500 font-medium">Amount</th>
                    <th className="text-left py-2 text-surface-500 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(est.costs as Array<{ category: string; amount: number; description?: string }>).map((c, i) => (
                    <tr key={i} className="border-b border-surface-100">
                      <td className="py-2.5 text-surface-900">{c.category}</td>
                      <td className="py-2.5 text-right text-surface-700">${c.amount?.toLocaleString()}</td>
                      <td className="py-2.5 text-surface-500">{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-surface-400 text-sm">No costs defined</p>
            )}
          </div>
        )}

        {tab === 'risks' && (
          <div>
            {est.risks && (est.risks as unknown[]).length > 0 ? (
              <div className="space-y-3">
                {(est.risks as Array<{ risk: string; impact: string; likelihood: string; mitigation?: string }>).map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-50">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle
                        className={cn(
                          'w-4 h-4',
                          r.impact === 'high' ? 'text-error-500' :
                          r.impact === 'medium' ? 'text-tool-500' :
                          'text-surface-400',
                        )}
                      />
                      <span className="text-sm font-medium text-surface-900">
                        {r.risk}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-surface-500 pl-6">
                      <span>Impact: {r.impact}</span>
                      <span>Likelihood: {r.likelihood}</span>
                    </div>
                    {r.mitigation && (
                      <p className="text-xs text-surface-400 mt-1 pl-6">
                        Mitigation: {r.mitigation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-400 text-sm">No risks identified</p>
            )}
          </div>
        )}

        {tab === 'timeline' && (
          <div>
            {est.phases && (est.phases as unknown[]).length > 0 ? (
              <div className="space-y-3">
                {(est.phases as Array<{ name: string; hours: number; resources: number }>).map((p, i) => {
                  const weeks = Math.ceil(p.hours / (40 * (p.resources || 1)))
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-surface-700 truncate">
                        {p.name}
                      </div>
                      <div className="flex-1 h-6 rounded bg-surface-100 overflow-hidden">
                        <div
                          className="h-full rounded bg-primary-400 flex items-center px-2"
                          style={{
                            width: `${Math.min(
                              (p.hours / Math.max(...(est.phases as Array<{ hours: number }>).map((ph) => ph.hours), 1)) * 100,
                              100,
                            )}%`,
                          }}
                        >
                          <span className="text-xs text-white font-medium whitespace-nowrap">
                            {weeks}w
                          </span>
                        </div>
                      </div>
                      <div className="w-16 text-right text-xs text-surface-400">
                        {p.hours}h
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-surface-400 text-sm">No timeline data</p>
            )}
          </div>
        )}

        {tab === 'versions' && (
          <div>
            {versions.length > 0 ? (
              <div className="space-y-3">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-50"
                  >
                    <History className="w-4 h-4 text-agent-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-surface-900">
                        Version {v.version}
                      </div>
                      <div className="text-xs text-surface-500 mt-0.5">
                        {v.change_summary}
                      </div>
                      <div className="text-xs text-surface-400 mt-0.5">
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-400 text-sm">No version history</p>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div>
            {auditLog.length > 0 ? (
              <div className="space-y-3">
                {auditLog.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-50"
                  >
                    <FileText className="w-4 h-4 text-primary-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-surface-900 capitalize">
                        {a.action}
                      </div>
                      {a.details && (
                        <div className="text-xs text-surface-500 mt-0.5">
                          {JSON.stringify(a.details)}
                        </div>
                      )}
                      <div className="text-xs text-surface-400 mt-0.5">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-400 text-sm">No audit entries</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
