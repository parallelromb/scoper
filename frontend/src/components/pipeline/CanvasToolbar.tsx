import { useRef, useState } from 'react'
import {
  Save, FolderOpen, Play, Upload, Download,
  ZoomIn, ZoomOut, Maximize, Trash2, ChevronDown,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { usePipelineStore } from '../../stores/pipelineStore'
import { useReactFlow } from '@xyflow/react'
import { exportGraph, importGraph } from '../../lib/graph-serializer'

interface CanvasToolbarProps {
  onRun: () => void
  isRunning: boolean
}

export default function CanvasToolbar({ onRun, isRunning }: CanvasToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const saveGraph = usePipelineStore((s) => s.saveGraph)
  const clearCanvas = usePipelineStore((s) => s.clearCanvas)
  const nodes = usePipelineStore((s) => s.nodes)
  const edges = usePipelineStore((s) => s.edges)
  const graphName = usePipelineStore((s) => s.graphName)
  const savedPipelines = usePipelineStore((s) => s.savedPipelines)
  const listSavedPipelines = usePipelineStore((s) => s.listSavedPipelines)
  const loadGraph = usePipelineStore((s) => s.loadGraph)
  const setNodes = usePipelineStore((s) => s.setNodes)
  const setEdges = usePipelineStore((s) => s.setEdges)

  const [showLoadMenu, setShowLoadMenu] = useState(false)

  const graphId = usePipelineStore((s) => s.graphId)
  const setGraphName = usePipelineStore((s) => s.setGraphName)

  function handleExportJSON() {
    exportGraph({
      id: graphId ?? Date.now(),
      name: graphName,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type ?? 'pipelineNode',
        position: n.position,
        data: {
          label: n.data.label,
          config: n.data.config,
          status: n.data.status,
          output: n.data.output,
        },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
      })),
    })
  }

  async function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const graph = await importGraph(file)
      setNodes(
        graph.nodes.map((n) => ({
          id: n.id,
          type: n.type ?? 'pipelineNode',
          position: n.position,
          data: {
            label: n.data.label,
            nodeType: n.type ?? 'pipelineNode',
            config: n.data.config ?? {},
            status: n.data.status,
            output: n.data.output,
          },
        }))
      )
      setEdges(graph.edges)
      setGraphName(graph.name)
    } catch {
      // invalid file — silently ignore
    }
    e.target.value = ''
  }

  async function handleLoadClick() {
    await listSavedPipelines()
    setShowLoadMenu((v) => !v)
  }

  const btnClass = cn(
    'p-2 rounded-lg transition-colors',
    'hover:bg-surface-200/60 dark:hover:bg-surface-700/60',
    'text-surface-600 dark:text-surface-300'
  )

  return (
    <div className={cn(
      'absolute top-4 left-1/2 -translate-x-1/2 z-10',
      'flex items-center gap-1 px-2 py-1.5 rounded-xl',
      'bg-white/90 dark:bg-surface-800/90 backdrop-blur-xl',
      'border border-surface-200 dark:border-surface-700/50 shadow-lg'
    )}>
      <button onClick={() => saveGraph()} className={btnClass} title="Save">
        <Save className="w-4 h-4" />
      </button>

      {/* Load dropdown */}
      <div className="relative">
        <button onClick={handleLoadClick} className={cn(btnClass, 'flex items-center gap-0.5')} title="Load">
          <FolderOpen className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>
        {showLoadMenu && (
          <div className={cn(
            'absolute top-full mt-2 left-0 w-52 rounded-lg shadow-lg z-50',
            'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
            'max-h-60 overflow-y-auto py-1'
          )}>
            {savedPipelines.length === 0 ? (
              <div className="px-3 py-2 text-xs text-surface-400">No saved pipelines</div>
            ) : (
              savedPipelines.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    loadGraph(p.id)
                    setShowLoadMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
                >
                  {p.name}
                  <div className="text-[10px] text-surface-400 mt-0.5">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />

      <button
        onClick={onRun}
        disabled={isRunning || nodes.length === 0}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          isRunning
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 cursor-wait'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white',
          nodes.length === 0 && 'opacity-50 cursor-not-allowed'
        )}
        title="Run Pipeline"
      >
        <Play className={cn('w-3.5 h-3.5', isRunning && 'animate-pulse')} />
        {isRunning ? 'Running...' : 'Run'}
      </button>

      <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />

      <button onClick={() => fileInputRef.current?.click()} className={btnClass} title="Import JSON">
        <Upload className="w-4 h-4" />
      </button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />

      <button onClick={handleExportJSON} className={btnClass} title="Export JSON">
        <Download className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />

      <button onClick={() => zoomIn()} className={btnClass} title="Zoom In">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={() => zoomOut()} className={btnClass} title="Zoom Out">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button onClick={() => fitView({ padding: 0.2 })} className={btnClass} title="Fit View">
        <Maximize className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />

      <button onClick={clearCanvas} className={cn(btnClass, 'text-rose-500 dark:text-rose-400')} title="Clear Canvas">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

