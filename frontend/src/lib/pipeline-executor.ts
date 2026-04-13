import type { PipelineFlowNode, PipelineFlowEdge, PipelineNodeData } from '../stores/pipelineStore'
import type { ExecutionLog, NodeStatus } from '../types/pipeline'
import { getNodeDef } from './node-registry'
import { validateGraph } from './graph-validator'

interface ExecutionStoreActions {
  startRun: (runId: string) => void
  updateNodeStatus: (status: NodeStatus) => void
  addLog: (log: ExecutionLog) => void
  setResults: (results: unknown) => void
}

interface UpdateNodeDataFn {
  (nodeId: string, data: Partial<PipelineNodeData>): void
}

function generateId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function topologicalSort(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[]
): PipelineFlowNode[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  const nodeMap = new Map<string, PipelineFlowNode>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
    nodeMap.set(node.id, node)
  }

  for (const edge of edges) {
    const targets = adjacency.get(edge.source)
    if (targets) targets.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  }

  // Kahn's algorithm
  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const sorted: PipelineFlowNode[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node) sorted.push(node)

    for (const neighbor of adjacency.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Pipeline contains a cycle — cannot execute')
  }

  return sorted
}

function getUpstreamOutputs(
  nodeId: string,
  edges: PipelineFlowEdge[],
  outputs: Map<string, unknown>
): Record<string, unknown> {
  const upstream: Record<string, unknown> = {}
  for (const edge of edges) {
    if (edge.target === nodeId) {
      const sourceOutput = outputs.get(edge.source)
      if (sourceOutput !== undefined) {
        upstream[edge.source] = sourceOutput
      }
    }
  }
  return upstream
}

function buildContextString(upstream: Record<string, unknown>, maxChars = 8000): string {
  const text = JSON.stringify(upstream, null, 2)
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n... [truncated]'
}

function parseJSONResponse(content: string): unknown {
  // Strategy 1: direct parse
  try {
    return JSON.parse(content)
  } catch { /* continue */ }

  // Strategy 2: extract from markdown code fence
  const fenceMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1])
    } catch { /* continue */ }
  }

  // Strategy 3: regex extract {...} or [...]
  const objMatch = content.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch { /* continue */ }
  }
  const arrMatch = content.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0])
    } catch { /* continue */ }
  }

  // Strategy 4: return raw content
  return { raw_content: content }
}

const agentSystemPrompts: Record<string, string> = {
  aria: 'You are ARIA, an AI Requirements Analyst. Extract structured project requirements from the provided document. Output valid JSON with keys: requirements (array of {id, title, description, priority, complexity}), domain, topics, gaps.',
  nova: 'You are NOVA, an AI Estimation Engine. Generate effort, cost, and timeline estimates. Output valid JSON with keys: phases (array of {name, effort_hours, duration_weeks, resources}), total_effort_hours, total_cost, confidence_score, assumptions.',
  sentinel: 'You are SENTINEL, an AI Risk Analyst. Identify risks, assumptions, and mitigation strategies. Output valid JSON with keys: risks (array of {title, severity, probability, impact, mitigation}), assumptions.',
  atlas: 'You are ATLAS, an AI Technical Architect. Evaluate architecture and technical complexity. Output valid JSON with keys: architecture (object with components, integrations, constraints), complexity_score, recommendations.',
  chronos: 'You are CHRONOS, an AI Timeline Planner. Build phase schedules with dependencies. Output valid JSON with keys: timeline (array of {phase, start_week, end_week, dependencies, milestones}), total_duration_weeks, critical_path.',
  oracle: 'You are ORACLE, an AI Historical Advisor. Compare against past estimates for calibration. Output valid JSON with keys: insights (array of {finding, recommendation, confidence}), calibration_factor.',
  nexus: 'You are NEXUS, an AI Integration Specialist. Analyze integration points and API dependencies. Output valid JSON with keys: integrations (array of {system, type, complexity, effort_hours}), total_integration_effort.',
  prism: 'You are PRISM, an AI Resource Planner. Plan team composition, skills, and allocation. Output valid JSON with keys: resources (array of {role, count, utilization_pct, rate_per_hour}), total_team_size, monthly_cost.',
}

export async function executePipeline(
  nodes: PipelineFlowNode[],
  edges: PipelineFlowEdge[],
  executionStore: ExecutionStoreActions,
  updateNodeData: UpdateNodeDataFn
): Promise<unknown> {
  const runId = generateId()
  const startTime = Date.now()

  executionStore.startRun(runId)

  // Validate graph before execution
  const validation = validateGraph(nodes, edges)
  if (!validation.valid) {
    for (const err of validation.errors) {
      executionStore.addLog({
        nodeId: 'system',
        timestamp: new Date().toISOString(),
        message: `Validation error: ${err}`,
        level: 'error',
      })
    }
    for (const warn of validation.warnings) {
      executionStore.addLog({
        nodeId: 'system',
        timestamp: new Date().toISOString(),
        message: `Warning: ${warn}`,
        level: 'warn',
      })
    }
    executionStore.setResults(null)
    return null
  }

  // Log any warnings even if valid
  for (const warn of validation.warnings) {
    executionStore.addLog({
      nodeId: 'system',
      timestamp: new Date().toISOString(),
      message: `Warning: ${warn}`,
      level: 'warn',
    })
  }

  // Set all nodes to queued
  for (const node of nodes) {
    updateNodeData(node.id, { status: 'queued' })
    executionStore.updateNodeStatus({ nodeId: node.id, status: 'queued' })
  }

  // Save pipeline graph
  let pipelineId: number | null = null
  try {
    const saveRes = await fetch('/api/v2/pipelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Run ${runId}`,
        graph: JSON.stringify({ nodes, edges }),
      }),
    })
    if (saveRes.ok) {
      const saveData = await saveRes.json()
      pipelineId = saveData.id
    }
  } catch {
    // non-fatal
  }

  // Create run record
  let backendRunId: number | null = null
  if (pipelineId) {
    try {
      const runRes = await fetch('/api/v2/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_id: pipelineId, status: 'running' }),
      })
      if (runRes.ok) {
        const runData = await runRes.json()
        backendRunId = runData.id
      }
    } catch {
      // non-fatal
    }
  }

  // Topological sort
  let sorted: PipelineFlowNode[]
  try {
    sorted = topologicalSort(nodes, edges)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sort failed'
    executionStore.addLog({
      nodeId: 'system',
      timestamp: new Date().toISOString(),
      message: msg,
      level: 'error',
    })
    executionStore.setResults(null)
    return null
  }

  const nodeOutputs = new Map<string, unknown>()
  const agentOutputs: unknown[] = []
  let totalTokens = 0

  // Execute each node
  for (const node of sorted) {
    const nodeData = node.data as PipelineNodeData
    const nodeDef = getNodeDef(nodeData.nodeType)
    const category = nodeDef?.category || 'input'

    // Status -> running
    updateNodeData(node.id, { status: 'running' })
    executionStore.updateNodeStatus({ nodeId: node.id, status: 'running' })
    executionStore.addLog({
      nodeId: node.id,
      timestamp: new Date().toISOString(),
      message: `Starting ${nodeData.label}...`,
      level: 'info',
    })

    const nodeStart = Date.now()

    try {
      const upstream = getUpstreamOutputs(node.id, edges, nodeOutputs)
      let output: unknown = null

      switch (category) {
        case 'input': {
          output = {
            type: nodeData.nodeType,
            label: nodeData.label,
            content: (nodeData.config.content as string) || 'Sample document content for estimation',
          }
          break
        }

        case 'agent': {
          const defaultPrompt = agentSystemPrompts[nodeData.nodeType] || 'You are an AI agent. Analyze the input and produce a structured JSON response.'
          const systemPrompt = (nodeData.config.systemPrompt as string) || defaultPrompt
          const contextStr = buildContextString(upstream)
          const userMessage = `Analyze the following input and provide your structured assessment:\n\n${contextStr}`

          const chatRes = await fetch('/api/v2/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_prompt: systemPrompt,
              user_message: userMessage,
              model: (nodeData.config.model as string) || undefined,
              temperature: nodeData.config.temperature as number | undefined,
            }),
          })

          if (!chatRes.ok) {
            const errText = await chatRes.text()
            throw new Error(`LLM call failed: ${errText.slice(0, 200)}`)
          }

          const chatData = await chatRes.json()
          totalTokens += chatData.tokens_used || 0
          output = parseJSONResponse(chatData.content)
          agentOutputs.push(output)
          break
        }

        case 'tool': {
          output = {
            ...upstream,
            _tool_applied: nodeData.nodeType,
            _tool_config: nodeData.config,
          }
          break
        }

        case 'processing': {
          if (nodeData.nodeType === 'decision_gate') {
            const threshold = Number(nodeData.config.threshold ?? 0.7)
            const operator = (nodeData.config.operator as string) || '>='
            const field = (nodeData.config.field as string) || 'confidence_score'
            const values = Object.values(upstream)
            let score = 0
            for (const v of values) {
              if (v && typeof v === 'object' && field in (v as Record<string, unknown>)) {
                score = Number((v as Record<string, unknown>)[field])
                break
              }
            }
            let pass = false
            switch (operator) {
              case '>=': pass = score >= threshold; break
              case '>': pass = score > threshold; break
              case '<=': pass = score <= threshold; break
              case '<': pass = score < threshold; break
              case '==': pass = score === threshold; break
            }
            output = { ...upstream, _gate_pass: pass, _gate_score: score }
          } else if (nodeData.nodeType === 'checkpoint') {
            output = { ...upstream, _checkpoint: true, _checkpoint_label: nodeData.config.label }
          } else if (nodeData.nodeType === 'merge') {
            const merged: Record<string, unknown> = {}
            for (const [key, val] of Object.entries(upstream)) {
              if (val && typeof val === 'object') {
                Object.assign(merged, val)
              } else {
                merged[key] = val
              }
            }
            output = merged
          } else if (nodeData.nodeType === 'filter') {
            output = upstream // pass-through
          }
          break
        }

        case 'output': {
          // Merge all agent outputs into a final estimate
          const mergedEstimate: Record<string, unknown> = {}
          for (const ao of agentOutputs) {
            if (ao && typeof ao === 'object') {
              Object.assign(mergedEstimate, ao)
            }
          }
          // Also include direct upstream
          for (const val of Object.values(upstream)) {
            if (val && typeof val === 'object') {
              Object.assign(mergedEstimate, val)
            }
          }
          output = mergedEstimate
          break
        }

        case 'optimize': {
          output = { ...upstream, _optimize: nodeData.nodeType }
          break
        }

        default:
          output = upstream
      }

      nodeOutputs.set(node.id, output)
      const latencyMs = Date.now() - nodeStart

      updateNodeData(node.id, { status: 'done', output })
      executionStore.updateNodeStatus({
        nodeId: node.id,
        status: 'done',
        output,
        latencyMs,
      })
      executionStore.addLog({
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        message: `Completed in ${latencyMs}ms`,
        level: 'success',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      updateNodeData(node.id, { status: 'error' })
      executionStore.updateNodeStatus({
        nodeId: node.id,
        status: 'error',
        error: errorMsg,
      })
      executionStore.addLog({
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        message: `Error: ${errorMsg}`,
        level: 'error',
      })
    }
  }

  // Build final results from output nodes
  const outputNodes = sorted.filter((n) => {
    const def = getNodeDef((n.data as PipelineNodeData).nodeType)
    return def?.category === 'output'
  })

  let finalResults: unknown = null
  if (outputNodes.length > 0) {
    const lastOutputId = outputNodes[outputNodes.length - 1].id
    finalResults = nodeOutputs.get(lastOutputId)
  } else if (agentOutputs.length > 0) {
    // Merge all agent outputs
    const merged: Record<string, unknown> = {}
    for (const ao of agentOutputs) {
      if (ao && typeof ao === 'object') Object.assign(merged, ao)
    }
    finalResults = merged
  }

  const totalLatency = Date.now() - startTime

  // Update run record
  if (backendRunId) {
    try {
      await fetch(`/api/v2/runs/${backendRunId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          total_tokens: totalTokens,
          latency_ms: totalLatency,
          node_results: JSON.stringify(
            Object.fromEntries(nodeOutputs)
          ),
        }),
      })
    } catch {
      // non-fatal
    }
  }

  executionStore.addLog({
    nodeId: 'system',
    timestamp: new Date().toISOString(),
    message: `Pipeline complete. ${totalTokens} tokens, ${totalLatency}ms total.`,
    level: 'success',
  })

  executionStore.setResults(finalResults)
  return finalResults
}
