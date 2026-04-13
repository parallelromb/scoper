import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { usePipelineStore } from '../stores/pipelineStore'
import { useExecutionStore } from '../stores/executionStore'
import { getNodeDef } from '../lib/node-registry'
import { executePipeline } from '../lib/pipeline-executor'
import { applyTemplate } from '../lib/workflow-templates'
import BaseNode from '../components/pipeline/BaseNode'
import NodePalette from '../components/pipeline/NodePalette'
import PropertiesPanel from '../components/pipeline/PropertiesPanel'
import CanvasToolbar from '../components/pipeline/CanvasToolbar'
import ExecutionOverlay from '../components/pipeline/ExecutionOverlay'

const nodeTypes: NodeTypes = {
  pipelineNode: BaseNode,
}

let nodeIdCounter = 0

function PipelineInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const nodes = usePipelineStore((s) => s.nodes)
  const edges = usePipelineStore((s) => s.edges)
  const onNodesChange = usePipelineStore((s) => s.onNodesChange)
  const onEdgesChange = usePipelineStore((s) => s.onEdgesChange)
  const onConnect = usePipelineStore((s) => s.onConnect)
  const addNode = usePipelineStore((s) => s.addNode)
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode)
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId)
  const updateNodeData = usePipelineStore((s) => s.updateNodeData)

  const isRunning = useExecutionStore((s) => s.isRunning)
  const showOverlay = useExecutionStore((s) => s.showOverlay)

  const onNodeClick = useCallback(
    (_event: unknown, node: { id: string }) => {
      setSelectedNode(node.id)
    },
    [setSelectedNode]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/aries-node-type')
      if (!type) return

      const nodeDef = getNodeDef(type)
      if (!nodeDef) return

      const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!wrapperBounds) return

      const position = {
        x: event.clientX - wrapperBounds.left - 90,
        y: event.clientY - wrapperBounds.top - 26,
      }

      const newNode = {
        id: `${type}_${++nodeIdCounter}_${Date.now()}`,
        type: 'pipelineNode',
        position,
        data: {
          label: nodeDef.label,
          nodeType: type,
          config: { ...nodeDef.defaultConfig },
        },
      }

      addNode(newNode)
    },
    [addNode]
  )

  const handleRun = useCallback(async () => {
    if (isRunning || nodes.length === 0) return
    const execStore = useExecutionStore.getState()
    await executePipeline(nodes, edges, execStore, updateNodeData)
  }, [nodes, edges, isRunning, updateNodeData])

  const clearCanvas = usePipelineStore((s) => s.clearCanvas)
  const setNodes = usePipelineStore((s) => s.setNodes)
  const setEdges = usePipelineStore((s) => s.setEdges)
  const setGraphName = usePipelineStore((s) => s.setGraphName)

  const handleTemplateClick = useCallback(
    (template: string) => {
      applyTemplate(template, { clearCanvas, setNodes, setEdges, setGraphName })
    },
    [clearCanvas, setNodes, setEdges, setGraphName]
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left -- Node Palette */}
      <div className="w-[280px] shrink-0 overflow-hidden">
        <NodePalette onTemplateClick={handleTemplateClick} />
      </div>

      {/* Center -- Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: { strokeWidth: 2, stroke: '#d2d2d7' },
          }}
          className="bg-[#fafafa]"
        >
          <CanvasToolbar onRun={handleRun} isRunning={isRunning} />
          <MiniMap
            position="bottom-right"
            className="!bg-white/90 !border-surface-200 !rounded-lg !shadow-sm"
            nodeColor={() => '#86868b'}
            maskColor="rgba(0,0,0,0.06)"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d2d2d7" />
        </ReactFlow>

        {/* Execution overlay */}
        {showOverlay && <ExecutionOverlay />}
      </div>

      {/* Right -- Properties Panel */}
      {selectedNodeId && (
        <div className="w-[320px] shrink-0 overflow-hidden">
          <PropertiesPanel />
        </div>
      )}
    </div>
  )
}

export default function Pipeline() {
  return (
    <ReactFlowProvider>
      <PipelineInner />
    </ReactFlowProvider>
  )
}
