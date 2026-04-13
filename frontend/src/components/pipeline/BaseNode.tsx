import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '../../lib/cn'
import { getNodeDef, categoryMeta } from '../../lib/node-registry'
import type { PipelineNodeData } from '../../stores/pipelineStore'
import * as LucideIcons from 'lucide-react'
import { CheckCircle, XCircle, Loader, Circle } from 'lucide-react'

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  sky:     { border: 'border-l-sky-500',    bg: 'bg-sky-50',     text: 'text-sky-700' },
  violet:  { border: 'border-l-violet-500', bg: 'bg-violet-50',  text: 'text-violet-700' },
  amber:   { border: 'border-l-amber-500',  bg: 'bg-amber-50',   text: 'text-amber-700' },
  emerald: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  slate:   { border: 'border-l-slate-500',  bg: 'bg-slate-50',   text: 'text-slate-700' },
  cyan:    { border: 'border-l-cyan-500',   bg: 'bg-cyan-50',    text: 'text-cyan-700' },
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'running':
      return <Loader className="w-3.5 h-3.5 text-blue-500 animate-spin" />
    case 'done':
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-rose-500" />
    default:
      return <Circle className="w-3.5 h-3.5 text-surface-300" />
  }
}

function getIcon(iconName: string) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  const Icon = icons[iconName]
  return Icon || LucideIcons.Box
}

function BaseNode({ data }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const nodeData = data as unknown as PipelineNodeData
  const nodeDef = getNodeDef(nodeData.nodeType)
  const category = nodeDef?.category || 'input'
  const colors = colorMap[nodeDef?.color || 'slate']
  const _catMeta = categoryMeta[category]
  const Icon = getIcon(nodeDef?.icon || 'Box')
  const inputPorts = nodeDef?.ports.inputs || []
  const outputPorts = nodeDef?.ports.outputs || []

  return (
    <div
      className={cn(
        'relative w-[180px] rounded-lg border-l-[3px] border border-surface-200 shadow-sm',
        colors.border,
        'bg-white backdrop-blur-sm',
        'transition-shadow hover:shadow-md',
        nodeData.status === 'running' && 'ring-2 ring-blue-400/50 ring-offset-1 ring-offset-white'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Input handles */}
      {inputPorts.length > 0 ? (
        inputPorts.map((port, i) => (
          <Handle
            key={`in-${port}`}
            type="target"
            position={Position.Left}
            id={port}
            className="!w-2.5 !h-2.5 !bg-surface-400 !border-2 !border-white"
            style={{ top: `${((i + 1) / (inputPorts.length + 1)) * 100}%` }}
          />
        ))
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-surface-400 !border-2 !border-white !opacity-0"
        />
      )}

      {/* Node body */}
      <div className="px-3 py-2.5 flex items-center gap-2 min-h-[52px]">
        <div className={cn('shrink-0 p-1 rounded', colors.bg)}>
          <Icon className={cn('w-4 h-4', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-surface-800 truncate leading-tight">
            {nodeData.label}
          </div>
          {nodeDef && (
            <div className="text-[10px] text-surface-400 truncate leading-tight mt-0.5">
              {_catMeta.label}
            </div>
          )}
        </div>
        <StatusIcon status={nodeData.status} />
      </div>

      {/* Output handles */}
      {outputPorts.length > 0 ? (
        outputPorts.map((port, i) => (
          <Handle
            key={`out-${port}`}
            type="source"
            position={Position.Right}
            id={port}
            className="!w-2.5 !h-2.5 !bg-surface-400 !border-2 !border-white"
            style={{ top: `${((i + 1) / (outputPorts.length + 1)) * 100}%` }}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !bg-surface-400 !border-2 !border-white !opacity-0"
        />
      )}

      {/* Tooltip on hover */}
      {hovered && nodeDef && (
        <div className="absolute z-50 left-full ml-2 top-0 w-56 p-3 rounded-lg bg-white shadow-lg border border-surface-200 text-xs pointer-events-none">
          <p className="font-semibold text-surface-800 mb-1">{nodeDef.label}</p>
          <p className="text-surface-500 mb-2 leading-relaxed">{nodeDef.description}</p>
          {inputPorts.length > 0 && (
            <div className="mb-1">
              <span className="text-surface-400">In: </span>
              <span className="text-surface-600">{inputPorts.join(', ')}</span>
            </div>
          )}
          {outputPorts.length > 0 && (
            <div className="mb-1">
              <span className="text-surface-400">Out: </span>
              <span className="text-surface-600">{outputPorts.join(', ')}</span>
            </div>
          )}
          {nodeData.status === 'done' && nodeData.output != null && (
            <div className="mt-2 pt-2 border-t border-surface-200">
              <span className="text-emerald-600">Output: </span>
              <span className="text-surface-600 break-all">
                {typeof nodeData.output === 'string'
                  ? (nodeData.output as string).slice(0, 100)
                  : JSON.stringify(nodeData.output).slice(0, 100)}
                {'...'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(BaseNode)
