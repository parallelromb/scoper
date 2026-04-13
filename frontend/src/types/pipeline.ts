export interface PipelineNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    config: Record<string, unknown>
    status?: 'queued' | 'running' | 'done' | 'error'
    output?: unknown
  }
}

export interface PipelineEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface PipelineGraph {
  id: string | number
  name: string
  nodes: PipelineNode[]
  edges: PipelineEdge[]
}

export interface ExecutionLog {
  nodeId: string
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error' | 'success'
}

export interface NodeStatus {
  nodeId: string
  status: 'queued' | 'running' | 'done' | 'error'
  output?: unknown
  error?: string
  tokensUsed?: number
  latencyMs?: number
}
