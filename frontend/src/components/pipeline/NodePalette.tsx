import { useState } from 'react'
import { Search, ChevronDown, ChevronRight, Zap, FileText, Layers, BarChart3, Workflow } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '../../lib/cn'
import { getNodesByCategory, categoryMeta, type NodeCategory, type NodeDefinition } from '../../lib/node-registry'

const categories: NodeCategory[] = ['input', 'agent', 'tool', 'processing', 'output', 'optimize']

const templateButtons = [
  { label: 'Quick', icon: Zap, desc: 'Upload + ARIA + NOVA + Report' },
  { label: 'Standard', icon: FileText, desc: '6-node with timeline' },
  { label: 'Enterprise', icon: Layers, desc: 'All agents hub-and-spoke' },
  { label: 'Re-Estimate', icon: BarChart3, desc: 'Update existing estimate' },
  { label: 'Jira', icon: Workflow, desc: 'Import from Jira' },
]

const categoryColorDot: Record<string, string> = {
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
  cyan: 'bg-cyan-500',
}

function getIcon(iconName: string) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  return icons[iconName] || LucideIcons.Box
}

function DraggableNodeItem({ node }: { node: NodeDefinition }) {
  const Icon = getIcon(node.icon)

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/aries-node-type', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing',
        'hover:bg-surface-100',
        'transition-colors select-none group'
      )}
    >
      <div className={cn(
        'shrink-0 p-1.5 rounded-md',
        node.color === 'sky' && 'bg-sky-100',
        node.color === 'violet' && 'bg-violet-100',
        node.color === 'amber' && 'bg-amber-100',
        node.color === 'emerald' && 'bg-emerald-100',
        node.color === 'slate' && 'bg-slate-100',
        node.color === 'cyan' && 'bg-cyan-100',
      )}>
        <Icon className={cn(
          'w-3.5 h-3.5',
          node.color === 'sky' && 'text-sky-600',
          node.color === 'violet' && 'text-violet-600',
          node.color === 'amber' && 'text-amber-600',
          node.color === 'emerald' && 'text-emerald-600',
          node.color === 'slate' && 'text-slate-600',
          node.color === 'cyan' && 'text-cyan-600',
        )} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-surface-800 truncate">
          {node.label}
        </div>
        <div className="text-[10px] text-surface-400 truncate leading-tight">
          {node.description}
        </div>
      </div>
    </div>
  )
}

interface NodePaletteProps {
  onTemplateClick?: (template: string) => void
}

export default function NodePalette({ onTemplateClick }: NodePaletteProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    input: true,
    agent: true,
    tool: false,
    processing: false,
    output: false,
    optimize: false,
  })

  const toggleCategory = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))

  const searchLower = search.toLowerCase()

  return (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl border-r border-surface-200">
      {/* Search */}
      <div className="p-3 border-b border-surface-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full pl-8 pr-3 py-2 text-xs rounded-lg',
              'bg-surface-50 border border-surface-200',
              'text-surface-800 placeholder:text-surface-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500'
            )}
          />
        </div>
      </div>

      {/* Workflow Templates */}
      {!search && (
        <div className="p-3 border-b border-surface-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mb-2">
            Templates
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {templateButtons.map((t) => (
              <button
                key={t.label}
                onClick={() => onTemplateClick?.(t.label.toLowerCase())}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left',
                  'bg-surface-50 hover:bg-surface-100',
                  'border border-surface-200',
                  'transition-colors text-[10px]'
                )}
                title={t.desc}
              >
                <t.icon className="w-3 h-3 text-surface-500 shrink-0" />
                <span className="text-surface-700 font-medium truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category sections */}
      <div className="flex-1 overflow-y-auto pb-4">
        {categories.map((cat) => {
          const meta = categoryMeta[cat]
          const nodes = getNodesByCategory(cat).filter(
            (n) =>
              !search ||
              n.label.toLowerCase().includes(searchLower) ||
              n.description.toLowerCase().includes(searchLower)
          )

          if (search && nodes.length === 0) return null

          const isExpanded = search ? true : expanded[cat]

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold',
                  'hover:bg-surface-50 transition-colors'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', categoryColorDot[meta.color])} />
                <span className="text-surface-600 flex-1 text-left">{meta.label}</span>
                <span className="text-[10px] text-surface-400 mr-1">{nodes.length}</span>
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
                  : <ChevronRight className="w-3.5 h-3.5 text-surface-400" />}
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {nodes.map((node) => (
                    <DraggableNodeItem key={node.id} node={node} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
