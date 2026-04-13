import type { PipelineFlowNode, PipelineFlowEdge } from '../stores/pipelineStore'
import { getNodeDef } from './node-registry'

interface TemplateDefinition {
  id: string
  label: string
  description: string
  nodes: { type: string; x: number; y: number }[]
  edges: [number, number][] // index pairs [source, target]
}

const templates: TemplateDefinition[] = [
  {
    id: 'quick',
    label: 'Quick Estimate',
    description: 'Upload + ARIA + NOVA + Report',
    nodes: [
      { type: 'document_upload', x: 0, y: 200 },
      { type: 'aria', x: 300, y: 200 },
      { type: 'nova', x: 600, y: 200 },
      { type: 'report', x: 900, y: 200 },
    ],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
  {
    id: 'standard',
    label: 'Standard',
    description: '6-node with timeline',
    nodes: [
      { type: 'document_upload', x: 0, y: 250 },
      { type: 'aria', x: 300, y: 250 },
      { type: 'nova', x: 600, y: 200 },
      { type: 'chronos', x: 600, y: 350 },
      { type: 'prism', x: 900, y: 200 },
      { type: 'report', x: 1200, y: 200 },
      { type: 'excel', x: 1200, y: 350 },
    ],
    edges: [[0, 1], [1, 2], [1, 3], [2, 4], [4, 5], [4, 6]],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'All agents hub-and-spoke',
    nodes: [
      { type: 'document_upload', x: 0, y: 400 },
      { type: 'aria', x: 250, y: 400 },
      { type: 'nova', x: 500, y: 50 },
      { type: 'sentinel', x: 500, y: 150 },
      { type: 'atlas', x: 500, y: 250 },
      { type: 'chronos', x: 500, y: 350 },
      { type: 'nexus', x: 500, y: 450 },
      { type: 'prism', x: 500, y: 550 },
      { type: 'oracle', x: 500, y: 650 },
      { type: 'merge', x: 750, y: 400 },
      { type: 'report', x: 1000, y: 300 },
      { type: 'excel', x: 1000, y: 400 },
      { type: 'html_output', x: 1000, y: 500 },
    ],
    edges: [
      [0, 1],
      [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8],
      [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9],
      [9, 10], [9, 11], [9, 12],
    ],
  },
  {
    id: 're-estimate',
    label: 'Re-Estimate',
    description: 'Update existing estimate',
    nodes: [
      { type: 'manual_entry', x: 0, y: 200 },
      { type: 'oracle', x: 300, y: 200 },
      { type: 'nova', x: 600, y: 200 },
      { type: 'sentinel', x: 900, y: 200 },
      { type: 'report', x: 1200, y: 200 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: 'jira',
    label: 'Jira Import',
    description: 'Import from Jira',
    nodes: [
      { type: 'jira_import', x: 0, y: 200 },
      { type: 'aria', x: 300, y: 200 },
      { type: 'nova', x: 600, y: 200 },
      { type: 'chronos', x: 900, y: 200 },
      { type: 'excel', x: 1200, y: 200 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
]

export const workflowTemplates = new Map<string, TemplateDefinition>(
  templates.map((t) => [t.id, t])
)

function buildTemplateGraph(template: TemplateDefinition): {
  nodes: PipelineFlowNode[]
  edges: PipelineFlowEdge[]
} {
  const prefix = `tpl_${template.id}`

  const nodes: PipelineFlowNode[] = template.nodes.map((n, i) => {
    const def = getNodeDef(n.type)
    return {
      id: `${prefix}_${n.type}_${i}`,
      type: 'pipelineNode',
      position: { x: n.x, y: n.y },
      data: {
        label: def?.label ?? n.type,
        nodeType: n.type,
        config: { ...(def?.defaultConfig ?? {}) },
      },
    }
  })

  const edges: PipelineFlowEdge[] = template.edges.map(([si, ti], i) => ({
    id: `${prefix}_edge_${i}`,
    source: nodes[si].id,
    target: nodes[ti].id,
  }))

  return { nodes, edges }
}

export function applyTemplate(
  templateId: string,
  store: {
    clearCanvas: () => void
    setNodes: (nodes: PipelineFlowNode[]) => void
    setEdges: (edges: PipelineFlowEdge[]) => void
    setGraphName: (name: string) => void
  }
): boolean {
  const template = workflowTemplates.get(templateId)
  if (!template) return false

  const { nodes, edges } = buildTemplateGraph(template)

  store.clearCanvas()
  store.setNodes(nodes)
  store.setEdges(edges)
  store.setGraphName(template.label)

  return true
}
