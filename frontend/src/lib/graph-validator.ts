import type { PipelineFlowNode, PipelineFlowEdge, PipelineNodeData } from '../stores/pipelineStore'
import { getNodeDef } from './node-registry'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateGraph(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (nodes.length === 0) {
    return { valid: false, errors: ['Pipeline is empty — add at least one node'], warnings }
  }

  // Classify nodes
  const inputNodes: PipelineFlowNode[] = []
  const outputNodes: PipelineFlowNode[] = []

  for (const node of nodes) {
    const def = getNodeDef((node.data as PipelineNodeData).nodeType)
    if (def?.category === 'input') inputNodes.push(node)
    if (def?.category === 'output') outputNodes.push(node)
  }

  // At least one input and one output
  if (inputNodes.length === 0) {
    errors.push('Pipeline has no input node — add a Document Upload, Manual Entry, or other input')
  }
  if (outputNodes.length === 0) {
    warnings.push('Pipeline has no output node — results may not be saved')
  }

  // Build adjacency structures
  const incomingEdges = new Map<string, string[]>()
  const outgoingEdges = new Map<string, string[]>()
  const nodeMap = new Map<string, PipelineFlowNode>()

  for (const node of nodes) {
    incomingEdges.set(node.id, [])
    outgoingEdges.set(node.id, [])
    nodeMap.set(node.id, node)
  }

  for (const edge of edges) {
    incomingEdges.get(edge.target)?.push(edge.source)
    outgoingEdges.get(edge.source)?.push(edge.target)
  }

  // Check required input ports — non-input nodes need at least one incoming edge
  for (const node of nodes) {
    const data = node.data as PipelineNodeData
    const def = getNodeDef(data.nodeType)
    if (def?.category === 'input') continue

    const incoming = incomingEdges.get(node.id) || []
    if (incoming.length === 0) {
      errors.push(`Node '${data.label}' has no incoming connections`)
    }
  }

  // Cycle detection via DFS
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<string, number>()
  for (const node of nodes) color.set(node.id, WHITE)

  let hasCycle = false

  function dfs(nodeId: string) {
    if (hasCycle) return
    color.set(nodeId, GRAY)
    for (const neighbor of outgoingEdges.get(nodeId) || []) {
      const c = color.get(neighbor)
      if (c === GRAY) {
        hasCycle = true
        return
      }
      if (c === WHITE) dfs(neighbor)
    }
    color.set(nodeId, BLACK)
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE) dfs(node.id)
    if (hasCycle) break
  }

  if (hasCycle) {
    errors.push('Pipeline contains a cycle — remove circular connections')
  }

  // Disconnected nodes — reachability from inputs forward and from outputs backward
  const reachableForward = new Set<string>()
  const reachableBackward = new Set<string>()

  function bfsForward(startIds: string[]) {
    const queue = [...startIds]
    while (queue.length > 0) {
      const id = queue.shift()!
      if (reachableForward.has(id)) continue
      reachableForward.add(id)
      for (const neighbor of outgoingEdges.get(id) || []) {
        queue.push(neighbor)
      }
    }
  }

  function bfsBackward(startIds: string[]) {
    const queue = [...startIds]
    while (queue.length > 0) {
      const id = queue.shift()!
      if (reachableBackward.has(id)) continue
      reachableBackward.add(id)
      for (const neighbor of incomingEdges.get(id) || []) {
        queue.push(neighbor)
      }
    }
  }

  bfsForward(inputNodes.map((n) => n.id))
  bfsBackward(outputNodes.map((n) => n.id))

  const connected = new Set([...reachableForward, ...reachableBackward])

  for (const node of nodes) {
    if (!connected.has(node.id)) {
      const data = node.data as PipelineNodeData
      warnings.push(`Node '${data.label}' is disconnected from the pipeline`)
    }
  }

  // Agent config checks
  for (const node of nodes) {
    const data = node.data as PipelineNodeData
    const def = getNodeDef(data.nodeType)
    if (def?.category === 'agent') {
      // Model is optional (uses default), but warn if temperature is out of range
      const temp = data.config.temperature as number | undefined
      if (temp !== undefined && (temp < 0 || temp > 2)) {
        warnings.push(`Agent '${data.label}' has temperature ${temp} — expected 0-2`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
