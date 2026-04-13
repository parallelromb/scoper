import { useState } from 'react'
import { cn } from '../../lib/cn'
import { useExecutionStore } from '../../stores/executionStore'
import { usePipelineStore } from '../../stores/pipelineStore'
import { getNodeDef } from '../../lib/node-registry'
import { X, Minimize2, Maximize2, ScrollText, BarChart3 } from 'lucide-react'

type Tab = 'logs' | 'results'

export default function ExecutionOverlay() {
  const [activeTab, setActiveTab] = useState<Tab>('logs')
  const [minimized, setMinimized] = useState(false)

  const showOverlay = useExecutionStore((s) => s.showOverlay)
  const setShowOverlay = useExecutionStore((s) => s.setShowOverlay)
  const isRunning = useExecutionStore((s) => s.isRunning)
  const logs = useExecutionStore((s) => s.logs)
  const results = useExecutionStore((s) => s.results)
  const nodeStatuses = useExecutionStore((s) => s.nodeStatuses)
  const nodes = usePipelineStore((s) => s.nodes)

  if (!showOverlay) return null

  const totalNodes = nodes.length
  const doneNodes = Array.from(nodeStatuses.values()).filter(
    (s) => s.status === 'done' || s.status === 'error'
  ).length
  const progress = totalNodes > 0 ? (doneNodes / totalNodes) * 100 : 0

  const levelColors: Record<string, string> = {
    info: 'text-blue-500',
    warn: 'text-amber-500',
    error: 'text-rose-500',
    success: 'text-emerald-500',
  }

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-20 transition-all duration-300',
        minimized ? 'h-10' : 'h-72',
        'bg-white/95 backdrop-blur-xl',
        'border-t border-surface-200',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-surface-800">
            {isRunning ? 'Running Pipeline...' : 'Execution Complete'}
          </span>

          {/* Progress bar */}
          <div className="w-32 h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isRunning ? 'bg-blue-500' : 'bg-emerald-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-surface-400">
            {doneNodes}/{totalNodes} nodes
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Tab buttons */}
          <button
            onClick={() => { setActiveTab('logs'); setMinimized(false) }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
              activeTab === 'logs' && !minimized
                ? 'bg-surface-100 text-surface-800'
                : 'text-surface-400 hover:text-surface-600'
            )}
          >
            <ScrollText className="w-3 h-3" />
            Logs
          </button>
          <button
            onClick={() => { setActiveTab('results'); setMinimized(false) }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
              activeTab === 'results' && !minimized
                ? 'bg-surface-100 text-surface-800'
                : 'text-surface-400 hover:text-surface-600'
            )}
          >
            <BarChart3 className="w-3 h-3" />
            Results
          </button>

          <div className="w-px h-4 bg-surface-200 mx-1" />

          <button
            onClick={() => setMinimized((v) => !v)}
            className="p-1 rounded hover:bg-surface-100 text-surface-400"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowOverlay(false)}
            className="p-1 rounded hover:bg-surface-100 text-surface-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
          {activeTab === 'logs' && (
            <div className="p-3 space-y-0.5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-surface-400 py-4 text-center">No logs yet...</div>
              ) : (
                logs.map((log, i) => {
                  const nodeDef = getNodeDef(log.nodeId)
                  return (
                    <div key={i} className="flex items-start gap-2 py-0.5">
                      <span className="text-surface-400 shrink-0 w-16 text-right">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                      <span className={cn('shrink-0 w-20 text-right font-semibold', levelColors[log.level] || 'text-surface-500')}>
                        [{nodeDef?.label || log.nodeId}]
                      </span>
                      <span className="text-surface-600 break-all">
                        {log.message}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="p-4">
              {results ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-surface-800">
                    Estimation Results
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {typeof results === 'object' && results !== null && (
                      <>
                        {(results as Record<string, unknown>).total_effort_hours != null && (
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-primary-600">
                              {String((results as Record<string, unknown>).total_effort_hours)}h
                            </div>
                            <div className="text-[10px] text-surface-400 mt-0.5">Total Effort</div>
                          </div>
                        )}
                        {(results as Record<string, unknown>).total_cost != null && (
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-emerald-600">
                              ${String((results as Record<string, unknown>).total_cost)}
                            </div>
                            <div className="text-[10px] text-surface-400 mt-0.5">Total Cost</div>
                          </div>
                        )}
                        {(results as Record<string, unknown>).confidence_score != null && (
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-amber-600">
                              {String(Math.round(Number((results as Record<string, unknown>).confidence_score) * 100))}%
                            </div>
                            <div className="text-[10px] text-surface-400 mt-0.5">Confidence</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <pre className="text-[11px] font-mono bg-surface-50 p-3 rounded-lg overflow-auto max-h-32 text-surface-600 border border-surface-200">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-surface-400 py-8 text-sm">
                  {isRunning ? 'Waiting for results...' : 'No results available'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
