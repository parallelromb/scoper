import { usePipelineStore, type PipelineNodeData } from '../../stores/pipelineStore'
import { getNodeDef, categoryMeta } from '../../lib/node-registry'
import { cn } from '../../lib/cn'
import { Trash2, X } from 'lucide-react'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium text-surface-500 dark:text-surface-400 mb-1">
      {children}
    </label>
  )
}

export default function PropertiesPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId)
  const nodes = usePipelineStore((s) => s.nodes)
  const updateNodeData = usePipelineStore((s) => s.updateNodeData)
  const removeNode = usePipelineStore((s) => s.removeNode)
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode)

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node || !selectedNodeId) return null

  const nodeData = node.data as PipelineNodeData
  const nodeDef = getNodeDef(nodeData.nodeType)
  const category = nodeDef?.category || 'input'
  const meta = categoryMeta[category]

  const config = (nodeData.config || {}) as Record<string, unknown>

  function updateConfig(key: string, value: unknown) {
    updateNodeData(selectedNodeId!, {
      config: { ...config, [key]: value },
    })
  }

  function updateLabel(label: string) {
    updateNodeData(selectedNodeId!, { label })
  }

  const categoryBadgeColors: Record<string, string> = {
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  }

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-l border-surface-200 dark:border-surface-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700/50">
        <div>
          <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">Properties</h3>
          <span className={cn('inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium', categoryBadgeColors[nodeDef?.color || 'slate'])}>
            {meta.label}
          </span>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <X className="w-4 h-4 text-surface-400" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Label */}
        <div>
          <Label>Label</Label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => updateLabel(e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg',
              'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
              'text-surface-800 dark:text-surface-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500'
            )}
          />
        </div>

        {/* Node type */}
        <div>
          <Label>Node Type</Label>
          <div className="text-xs text-surface-600 dark:text-surface-300 font-mono bg-surface-50 dark:bg-surface-800 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700">
            {nodeData.nodeType}
          </div>
        </div>

        {/* Agent config */}
        {category === 'agent' && (
          <>
            <div>
              <Label>Model (blank = default)</Label>
              <select
                value={(config.model as string) || ''}
                onChange={(e) => updateConfig('model', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg appearance-none',
                  'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                  'text-surface-800 dark:text-surface-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
                )}
              >
                <option value="">Default (from config)</option>
                <option value="gemma3:27b">Gemma 3 27B</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="llama3.1:8b">Llama 3.1 8B</option>
              </select>
            </div>

            <div>
              <Label>Temperature ({String(config.temperature ?? 0.5)})</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={Number(config.temperature ?? 0.5)}
                onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <Label>Max Tokens</Label>
              <input
                type="number"
                value={Number(config.maxTokens ?? 4096)}
                onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value) || 4096)}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg',
                  'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                  'text-surface-800 dark:text-surface-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
                )}
              />
            </div>

            <div>
              <Label>System Prompt Override</Label>
              <textarea
                value={(config.systemPrompt as string) || ''}
                onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                rows={4}
                placeholder="Leave blank for default agent prompt..."
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg resize-y',
                  'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                  'text-surface-800 dark:text-surface-200 placeholder:text-surface-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
                )}
              />
            </div>
          </>
        )}

        {/* Decision gate config */}
        {nodeData.nodeType === 'decision_gate' && (
          <>
            <div>
              <Label>Threshold</Label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={Number(config.threshold ?? 0.7)}
                onChange={(e) => updateConfig('threshold', parseFloat(e.target.value))}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg',
                  'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                  'text-surface-800 dark:text-surface-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
                )}
              />
            </div>
            <div>
              <Label>Operator</Label>
              <select
                value={(config.operator as string) || '>='}
                onChange={(e) => updateConfig('operator', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg appearance-none',
                  'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                  'text-surface-800 dark:text-surface-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
                )}
              >
                <option value=">=">{'Greater or equal (>=)'}</option>
                <option value=">">{'Greater than (>)'}</option>
                <option value="<=">{'Less or equal (<=)'}</option>
                <option value="<">{'Less than (<)'}</option>
                <option value="==">{'Equal (==)'}</option>
              </select>
            </div>
          </>
        )}

        {/* Output node config */}
        {category === 'output' && (
          <div>
            <Label>Format</Label>
            <select
              value={(config.format as string) || 'pdf'}
              onChange={(e) => updateConfig('format', e.target.value)}
              className={cn(
                'w-full px-3 py-2 text-xs rounded-lg appearance-none',
                'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                'text-surface-800 dark:text-surface-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
              )}
            >
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        )}

        {/* Notes — all nodes */}
        <div>
          <Label>Notes</Label>
          <textarea
            value={(config.notes as string) || ''}
            onChange={(e) => updateConfig('notes', e.target.value)}
            rows={3}
            placeholder="Add notes about this node..."
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg resize-y',
              'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
              'text-surface-800 dark:text-surface-200 placeholder:text-surface-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
            )}
          />
        </div>
      </div>

      {/* Delete button */}
      <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700/50">
        <button
          onClick={() => {
            removeNode(selectedNodeId!)
            setSelectedNode(null)
          }}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
            'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
            'hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors',
            'border border-rose-200 dark:border-rose-800/50'
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>
      </div>
    </div>
  )
}
