import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

export interface PipelineNodeData {
  label: string
  nodeType: string
  config: Record<string, unknown>
  status?: 'queued' | 'running' | 'done' | 'error'
  output?: unknown
  [key: string]: unknown
}

export type PipelineFlowNode = Node<PipelineNodeData>
export type PipelineFlowEdge = Edge

interface SavedPipelineMeta {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface PipelineState {
  nodes: PipelineFlowNode[]
  edges: PipelineFlowEdge[]
  selectedNodeId: string | null
  graphName: string
  graphId: number | null
  savedPipelines: SavedPipelineMeta[]

  // Actions
  addNode: (node: PipelineFlowNode) => void
  removeNode: (nodeId: string) => void
  updateNodeData: (nodeId: string, data: Partial<PipelineNodeData>) => void
  onNodesChange: OnNodesChange<PipelineFlowNode>
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  setSelectedNode: (nodeId: string | null) => void
  setGraphName: (name: string) => void
  saveGraph: () => Promise<number | null>
  loadGraph: (id: number) => Promise<void>
  listSavedPipelines: () => Promise<void>
  clearCanvas: () => void
  setNodes: (nodes: PipelineFlowNode[]) => void
  setEdges: (edges: PipelineFlowEdge[]) => void
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  graphName: 'Untitled Pipeline',
  graphId: null,
  savedPipelines: [],

  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

  removeNode: (nodeId) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    })),

  updateNodeData: (nodeId, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) =>
    set((s) => ({ edges: addEdge(connection, s.edges) })),

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setGraphName: (name) => set({ graphName: name }),

  saveGraph: async () => {
    const { nodes, edges, graphName, graphId } = get()
    const payload = {
      name: graphName,
      graph: JSON.stringify({ nodes, edges }),
    }

    try {
      if (graphId) {
        await fetch(`/api/v2/pipelines/${graphId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        return graphId
      } else {
        const res = await fetch('/api/v2/pipelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) return null
        const data = await res.json()
        set({ graphId: data.id })
        return data.id
      }
    } catch {
      return null
    }
  },

  loadGraph: async (id) => {
    try {
      const res = await fetch(`/api/v2/pipelines/${id}`)
      if (!res.ok) return
      const data = await res.json()
      const graph = typeof data.graph === 'string' ? JSON.parse(data.graph) : data.graph
      set({
        nodes: graph.nodes || [],
        edges: graph.edges || [],
        graphName: data.name,
        graphId: data.id,
        selectedNodeId: null,
      })
    } catch {
      // ignore
    }
  },

  listSavedPipelines: async () => {
    try {
      const res = await fetch('/api/v2/pipelines')
      if (!res.ok) return
      const data = await res.json()
      set({ savedPipelines: data })
    } catch {
      // ignore
    }
  },

  clearCanvas: () =>
    set({ nodes: [], edges: [], selectedNodeId: null, graphId: null, graphName: 'Untitled Pipeline' }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}))
