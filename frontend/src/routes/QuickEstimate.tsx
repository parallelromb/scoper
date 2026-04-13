import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react'
import {
  Upload,
  Search,
  Brain,
  Calculator,
  CheckCircle2,
  FileText,
  ChevronRight,
  ChevronLeft,
  Download,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { analyzeDocument, type DocumentAnalysis } from '../lib/nlp'
import { llmChat, parseJSONResponse } from '../services/llmChat'
import { useEstimateStore, type Estimate, type EstimatePhase, type EstimateCost, type EstimateRisk } from '../stores/estimateStore'

const STEPS = [
  { label: 'Upload', icon: Upload },
  { label: 'Analyze', icon: Search },
  { label: 'Extract', icon: Brain },
  { label: 'Estimate', icon: Calculator },
  { label: 'Results', icon: CheckCircle2 },
]

const ACCEPT = '.pdf,.docx,.xlsx,.txt'

interface Requirements {
  functional: string[]
  non_functional: string[]
  integrations: string[]
  constraints: string[]
  assumptions: string[]
}

interface EstimateResult {
  project_name: string
  total_hours: number
  total_cost: number
  confidence: number
  phases: EstimatePhase[]
  costs: EstimateCost[]
  risks: EstimateRisk[]
  assumptions: string[]
}

const ARIA_PROMPT = `You are ARIA, an AI Requirements Analyst. Analyze the following document text and extract structured requirements. Return ONLY valid JSON with this structure:
{
  "functional": ["list of functional requirements"],
  "non_functional": ["list of non-functional requirements"],
  "integrations": ["list of integration requirements"],
  "constraints": ["list of constraints"],
  "assumptions": ["list of assumptions"]
}
Be thorough and specific. Each item should be a clear, actionable requirement.`

const NOVA_PROMPT = `You are NOVA, an AI Estimation Engine. Based on the following requirements and document analysis, generate a detailed project estimate. Return ONLY valid JSON with this structure:
{
  "project_name": "descriptive project name",
  "total_hours": number,
  "total_cost": number,
  "confidence": number between 0 and 100,
  "phases": [{"name": "phase name", "hours": number, "cost": number, "resources": number, "description": "brief description"}],
  "costs": [{"category": "cost category", "amount": number, "description": "brief description"}],
  "risks": [{"risk": "risk description", "impact": "high/medium/low", "likelihood": "high/medium/low", "mitigation": "mitigation strategy"}],
  "assumptions": ["list of assumptions made"]
}
Use industry-standard rates. Be realistic and detailed.`

export default function QuickEstimate() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [requirements, setRequirements] = useState<Requirements | null>(null)
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const createEstimate = useEstimateStore((s) => s.createEstimate)

  // -- File handling --

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setError(null)
    try {
      const text = await f.text()
      setRawText(text)
    } catch {
      setError('Could not read file. Try a .txt file for best results.')
    }
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const onFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  // -- Step actions --

  const runAnalysis = useCallback(() => {
    if (!rawText) return
    setLoading(true)
    // Slight delay for visual feedback
    setTimeout(() => {
      const result = analyzeDocument(rawText)
      setAnalysis(result)
      setLoading(false)
    }, 300)
  }, [rawText])

  const runExtraction = useCallback(async () => {
    if (!rawText) return
    setLoading(true)
    setError(null)
    try {
      const res = await llmChat(ARIA_PROMPT, rawText.slice(0, 12000))
      const parsed = parseJSONResponse<Requirements>(res.content)
      if (parsed) {
        setRequirements(parsed)
      } else {
        setError('Could not parse requirements from LLM response.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }, [rawText])

  const runEstimation = useCallback(async () => {
    if (!requirements) return
    setLoading(true)
    setError(null)
    const context = JSON.stringify({
      requirements,
      analysis: analysis
        ? { domains: analysis.domains.slice(0, 3), topics: analysis.topics.slice(0, 5), wordCount: analysis.wordCount, complexity: analysis.complexity }
        : null,
    })
    try {
      const res = await llmChat(NOVA_PROMPT, context)
      const parsed = parseJSONResponse<EstimateResult>(res.content)
      if (parsed) {
        setEstimate(parsed)
      } else {
        setError('Could not parse estimate from LLM response.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimation failed')
    } finally {
      setLoading(false)
    }
  }, [requirements, analysis])

  const handleNext = useCallback(() => {
    if (step === 1 && !analysis) runAnalysis()
    if (step === 2 && !requirements) {
      runExtraction()
      return // wait for async
    }
    if (step === 3 && !estimate) {
      runEstimation()
      return
    }
    setStep((s) => Math.min(s + 1, 4))
  }, [step, analysis, requirements, estimate, runAnalysis, runExtraction, runEstimation])

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const canNext =
    (step === 0 && rawText.length > 0) ||
    (step === 1 && analysis !== null) ||
    (step === 2 && requirements !== null) ||
    (step === 3 && estimate !== null) ||
    step === 4

  // -- Save & Export --

  const handleSave = async () => {
    if (!estimate) return
    const est: Omit<Estimate, 'id'> = {
      name: estimate.project_name || 'Quick Estimate',
      status: 'complete',
      total_effort_hours: estimate.total_hours,
      total_cost: estimate.total_cost,
      confidence_score: estimate.confidence,
      phases: estimate.phases,
      costs: estimate.costs,
      resources: null,
      risks: estimate.risks,
      assumptions: estimate.assumptions,
      source_document: file?.name || null,
    }
    await createEstimate(est)
    alert('Estimate saved!')
  }

  const handleDownload = () => {
    if (!estimate) return
    const blob = new Blob([JSON.stringify(estimate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${estimate.project_name || 'estimate'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Auto-advance when data arrives
  if (!loading && step === 2 && requirements && error === null) {
    setTimeout(() => setStep(3), 100)
  }
  if (!loading && step === 3 && estimate && error === null) {
    setTimeout(() => setStep(4), 100)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-surface-900 mb-8">
        Quick Estimate
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                i === step
                  ? 'bg-primary-500 text-white shadow-sm'
                  : i < step
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-surface-100 text-surface-400',
              )}
              disabled={i > step}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-surface-300" />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error-50 border border-error-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error-500 mt-0.5 shrink-0" />
          <div className="text-sm text-error-600">{error}</div>
        </div>
      )}

      {/* Step content */}
      <div className="glass-card p-8">
        {/* Step 0: Upload */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 mb-4">
              Upload Document
            </h2>
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer',
                dragOver
                  ? 'border-primary-400 bg-primary-50/50'
                  : 'border-surface-300 hover:border-primary-300',
              )}
            >
              <input
                type="file"
                accept={ACCEPT}
                onChange={onFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto mb-3 text-surface-400" />
                <p className="text-sm text-surface-600">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  Accepts: .pdf, .docx, .xlsx, .txt
                </p>
              </label>
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-surface-50">
                <FileText className="w-5 h-5 text-primary-500" />
                <div>
                  <div className="text-sm font-medium text-surface-900">
                    {file.name}
                  </div>
                  <div className="text-xs text-surface-400">
                    {(file.size / 1024).toFixed(1)} KB
                    {rawText && ` \u2022 ${rawText.split(/\s+/).length.toLocaleString()} words`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Analyze */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 mb-4">
              Document Analysis
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-surface-50">
                    <div className="text-xs text-surface-500 mb-1">Words</div>
                    <div className="text-xl font-bold text-surface-900">
                      {analysis.wordCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-50">
                    <div className="text-xs text-surface-500 mb-1">Complexity</div>
                    <div className={cn(
                      'text-xl font-bold capitalize',
                      analysis.complexity === 'high' ? 'text-error-500' :
                      analysis.complexity === 'medium' ? 'text-tool-500' :
                      'text-success-500',
                    )}>
                      {analysis.complexity}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-50">
                    <div className="text-xs text-surface-500 mb-1">Domains</div>
                    <div className="text-xl font-bold text-surface-900">
                      {analysis.domains.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-50">
                    <div className="text-xs text-surface-500 mb-1">Topics</div>
                    <div className="text-xl font-bold text-surface-900">
                      {analysis.topics.length}
                    </div>
                  </div>
                </div>

                {analysis.domains.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-surface-700 mb-2">
                      Detected Domains
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.domains.map((d) => (
                        <span
                          key={d.domain}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
                        >
                          {d.domain} ({Math.round(d.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.topics.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-surface-700 mb-2">
                      Topics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topics.map((t) => (
                        <span
                          key={t.topic}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-agent-100 text-agent-700"
                        >
                          {t.topic.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-surface-400">
                  Fingerprint: {analysis.fingerprint}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-surface-500 text-sm mb-4">
                  Click Next to analyze the uploaded document
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Extract */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 mb-4">
              Extract Requirements
            </h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-agent-500 animate-spin" />
                <p className="text-sm text-surface-500">ARIA is extracting requirements...</p>
              </div>
            ) : requirements ? (
              <div className="space-y-4">
                {Object.entries(requirements).map(([key, items]) => {
                  const arr = Array.isArray(items) ? items : []
                  if (arr.length === 0) return null
                  return (
                    <div key={key}>
                      <h3 className="text-sm font-semibold text-surface-700 capitalize mb-2">
                        {key.replace(/_/g, ' ')} ({arr.length})
                      </h3>
                      <ul className="space-y-1">
                        {arr.map((item: string, i: number) => (
                          <li
                            key={i}
                            className="text-sm text-surface-600 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-agent-400"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-10 h-10 mx-auto mb-3 text-surface-400" />
                <p className="text-surface-500 text-sm">
                  Click Next to extract requirements using ARIA agent
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Estimate */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 mb-4">
              Generate Estimate
            </h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-tool-500 animate-spin" />
                <p className="text-sm text-surface-500">NOVA is generating your estimate...</p>
              </div>
            ) : estimate ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success-500" />
                <p className="text-surface-700 font-medium">
                  Estimate generated successfully
                </p>
                <p className="text-sm text-surface-500 mt-1">
                  {estimate.phases?.length || 0} phases, {estimate.total_hours} hours total
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="w-10 h-10 mx-auto mb-3 text-surface-400" />
                <p className="text-surface-500 text-sm">
                  Click Next to generate estimate using NOVA agent
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && estimate && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-surface-900">
              {estimate.project_name || 'Estimate Results'}
            </h2>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-primary-50 border border-primary-200/50">
                <div className="text-xs text-primary-600 mb-1">Total Hours</div>
                <div className="text-2xl font-bold text-primary-700">
                  {estimate.total_hours?.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-success-50 border border-success-100">
                <div className="text-xs text-success-600 mb-1">Total Cost</div>
                <div className="text-2xl font-bold text-success-600">
                  ${estimate.total_cost?.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-agent-50 border border-agent-200/50">
                <div className="text-xs text-agent-600 mb-1">Confidence</div>
                <div className="text-2xl font-bold text-agent-600">
                  {estimate.confidence}%
                </div>
              </div>
              <div className="p-4 rounded-xl bg-tool-50 border border-tool-200/50">
                <div className="text-xs text-tool-600 mb-1">Phases</div>
                <div className="text-2xl font-bold text-tool-600">
                  {estimate.phases?.length || 0}
                </div>
              </div>
            </div>

            {/* Phase breakdown */}
            {estimate.phases && estimate.phases.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-700 mb-3">
                  Phase Breakdown
                </h3>
                <div className="overflow-x-auto">
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
                      {estimate.phases.map((p, i) => (
                        <tr key={i} className="border-b border-surface-100">
                          <td className="py-2 text-surface-900">
                            {p.name}
                            {p.description && (
                              <div className="text-xs text-surface-400 mt-0.5">{p.description}</div>
                            )}
                          </td>
                          <td className="py-2 text-right text-surface-700">{p.hours}</td>
                          <td className="py-2 text-right text-surface-700">${p.cost?.toLocaleString()}</td>
                          <td className="py-2 text-right text-surface-700">{p.resources}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cost breakdown */}
            {estimate.costs && estimate.costs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-700 mb-3">
                  Cost Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="text-left py-2 text-surface-500 font-medium">Category</th>
                        <th className="text-right py-2 text-surface-500 font-medium">Amount</th>
                        <th className="text-left py-2 text-surface-500 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimate.costs.map((c, i) => (
                        <tr key={i} className="border-b border-surface-100">
                          <td className="py-2 text-surface-900">{c.category}</td>
                          <td className="py-2 text-right text-surface-700">
                            ${c.amount?.toLocaleString()}
                          </td>
                          <td className="py-2 text-surface-500">{c.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Risks */}
            {estimate.risks && estimate.risks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-700 mb-3">
                  Risks
                </h3>
                <div className="space-y-2">
                  {estimate.risks.map((r, i) => (
                    <div key={i} className="p-3 rounded-lg bg-surface-50">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={cn(
                          'w-4 h-4',
                          r.impact === 'high' ? 'text-error-500' :
                          r.impact === 'medium' ? 'text-tool-500' :
                          'text-surface-400',
                        )} />
                        <span className="text-sm font-medium text-surface-900">
                          {r.risk}
                        </span>
                        <span className={cn(
                          'ml-auto text-xs px-2 py-0.5 rounded-full',
                          r.impact === 'high'
                            ? 'bg-error-100 text-error-600'
                            : r.impact === 'medium'
                              ? 'bg-tool-100 text-tool-600'
                              : 'bg-surface-100 text-surface-500',
                        )}>
                          {r.impact}
                        </span>
                      </div>
                      {r.mitigation && (
                        <p className="text-xs text-surface-500 pl-6">
                          Mitigation: {r.mitigation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export buttons */}
            <div className="flex gap-3 pt-4 border-t border-surface-200">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Estimate
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-300 text-surface-700 hover:bg-surface-50 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {step < 4 && (
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              step === 0
                ? 'text-surface-300 cursor-not-allowed'
                : 'text-surface-600 hover:bg-surface-100',
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext || loading}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
              canNext && !loading
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-surface-200 text-surface-400 cursor-not-allowed',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
