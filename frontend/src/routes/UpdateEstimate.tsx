import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Brain,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useEstimateStore, type EstimatePhase } from '../stores/estimateStore'
import { llmChat, parseJSONResponse } from '../services/llmChat'

const STATUS_OPTIONS = ['draft', 'complete', 'archived']

const NOVA_RE_ESTIMATE_PROMPT = `You are NOVA, an AI Estimation Engine. The user wants to re-estimate this project. Given the current estimate data below, produce an improved estimate. Consider if hours, costs, or risks should be adjusted. Return ONLY valid JSON with this structure:
{
  "total_hours": number,
  "total_cost": number,
  "confidence": number between 0 and 100,
  "phases": [{"name": "phase name", "hours": number, "cost": number, "resources": number, "description": "brief description"}],
  "costs": [{"category": "cost category", "amount": number, "description": "brief description"}],
  "risks": [{"risk": "risk description", "impact": "high/medium/low", "likelihood": "high/medium/low", "mitigation": "mitigation strategy"}]
}`

export default function UpdateEstimate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loadEstimate, updateEstimate, currentEstimate, loading: storeLoading } = useEstimateStore()

  const [name, setName] = useState('')
  const [status, setStatus] = useState('draft')
  const [phases, setPhases] = useState<EstimatePhase[]>([])
  const [saving, setSaving] = useState(false)
  const [reEstimating, setReEstimating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadEstimate(Number(id))
  }, [id, loadEstimate])

  useEffect(() => {
    if (currentEstimate) {
      setName(currentEstimate.name)
      setStatus(currentEstimate.status)
      setPhases(
        (currentEstimate.phases as EstimatePhase[]) || [],
      )
    }
  }, [currentEstimate])

  const addPhase = () => {
    setPhases([...phases, { name: '', hours: 0, cost: 0, resources: 1 }])
  }

  const removePhase = (idx: number) => {
    setPhases(phases.filter((_, i) => i !== idx))
  }

  const updatePhase = (idx: number, field: keyof EstimatePhase, value: string | number) => {
    setPhases(
      phases.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p,
      ),
    )
  }

  const handleSave = useCallback(async () => {
    if (!id) return
    setSaving(true)
    setError(null)
    try {
      const totalHours = phases.reduce((s, p) => s + (p.hours || 0), 0)
      const totalCost = phases.reduce((s, p) => s + (p.cost || 0), 0)
      await updateEstimate(Number(id), {
        name,
        status,
        phases,
        total_effort_hours: totalHours,
        total_cost: totalCost,
      })
      // Create audit entry
      await fetch('/api/v2/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'estimate',
          entity_id: Number(id),
          action: 'updated',
          details: { name, status, phases_count: phases.length },
        }),
      }).catch(() => {})
      navigate(`/estimates/${id}`)
    } catch {
      setError('Failed to save estimate')
    } finally {
      setSaving(false)
    }
  }, [id, name, status, phases, updateEstimate, navigate])

  const handleReEstimate = useCallback(async () => {
    setReEstimating(true)
    setError(null)
    try {
      const context = JSON.stringify({
        name,
        status,
        phases,
        total_hours: phases.reduce((s, p) => s + (p.hours || 0), 0),
        total_cost: phases.reduce((s, p) => s + (p.cost || 0), 0),
      })
      const res = await llmChat(NOVA_RE_ESTIMATE_PROMPT, context)
      const parsed = parseJSONResponse<{
        total_hours: number
        total_cost: number
        confidence: number
        phases: EstimatePhase[]
      }>(res.content)
      if (parsed?.phases) {
        setPhases(parsed.phases)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-estimation failed')
    } finally {
      setReEstimating(false)
    }
  }, [name, status, phases])

  if (storeLoading && !currentEstimate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-surface-500 text-sm">Loading...</div>
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400'

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        to={`/estimates/${id}`}
        className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Estimate
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900">
          Update Estimate
        </h1>
        <button
          onClick={handleReEstimate}
          disabled={reEstimating}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            reEstimating
              ? 'bg-agent-100 text-agent-500 cursor-wait'
              : 'bg-agent-500 text-white hover:bg-agent-600',
          )}
        >
          {reEstimating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          Re-Estimate with AI
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error-50 border border-error-200 text-sm text-error-600">
          {error}
        </div>
      )}

      <div className="glass-card p-6 space-y-6">
        {/* Name & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Phases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-surface-700">
              Phases
            </label>
            <button
              onClick={addPhase}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Phase
            </button>
          </div>
          {phases.length > 0 ? (
            <div className="space-y-3">
              {phases.map((phase, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-surface-50 border border-surface-200/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="Phase name"
                          value={phase.name}
                          onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Hours"
                          value={phase.hours || ''}
                          onChange={(e) => updatePhase(idx, 'hours', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-md border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Cost"
                          value={phase.cost || ''}
                          onChange={(e) => updatePhase(idx, 'cost', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-md border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removePhase(idx)}
                      className="p-1.5 rounded-md text-surface-400 hover:text-error-500 hover:bg-error-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-400 text-sm py-4 text-center">
              No phases yet. Click "Add Phase" to start.
            </p>
          )}
        </div>

        {/* Summary */}
        {phases.length > 0 && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-primary-50/50 border border-primary-200/30">
            <div>
              <div className="text-xs text-primary-600">Total Hours</div>
              <div className="text-lg font-bold text-primary-700">
                {phases.reduce((s, p) => s + (p.hours || 0), 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-primary-600">Total Cost</div>
              <div className="text-lg font-bold text-primary-700">
                ${phases.reduce((s, p) => s + (p.cost || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end pt-4 border-t border-surface-200">
          <button
            onClick={handleSave}
            disabled={saving || !name}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
              saving || !name
                ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600',
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
