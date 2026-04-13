import type { PipelineGraph } from '../types/pipeline'

const CURRENT_VERSION = '1.0.0'

interface ExportedGraph {
  version: string
  exportedAt: string
  name: string
  graph: PipelineGraph
}

export function exportGraph(graph: PipelineGraph): void {
  const payload: ExportedGraph = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    name: graph.name,
    graph,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${graph.name.replace(/\s+/g, '_').toLowerCase()}_pipeline.json`
  anchor.click()

  URL.revokeObjectURL(url)
}

export async function importGraph(file: File): Promise<PipelineGraph> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string
        const data = JSON.parse(raw)

        // Support both wrapped export format and raw graph format
        let graph: PipelineGraph

        if (data.graph && data.version) {
          // Wrapped export format
          graph = data.graph as PipelineGraph
        } else if (data.nodes && Array.isArray(data.nodes)) {
          // Raw graph format (backward compat with existing export)
          graph = {
            id: Date.now(),
            name: data.name || 'Imported Pipeline',
            nodes: data.nodes,
            edges: data.edges || [],
          }
        } else {
          throw new Error('Invalid pipeline file — expected nodes array or exported graph')
        }

        // Basic structure validation
        if (!Array.isArray(graph.nodes)) {
          throw new Error('Invalid pipeline file — nodes must be an array')
        }
        if (!Array.isArray(graph.edges)) {
          throw new Error('Invalid pipeline file — edges must be an array')
        }

        resolve(graph)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse pipeline file'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
