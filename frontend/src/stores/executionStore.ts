import { create } from 'zustand'
import type { ExecutionLog, NodeStatus } from '../types/pipeline'

interface ExecutionState {
  runId: string | null
  isRunning: boolean
  nodeStatuses: Map<string, NodeStatus>
  logs: ExecutionLog[]
  results: unknown | null
  showOverlay: boolean

  // Actions
  startRun: (runId: string) => void
  updateNodeStatus: (status: NodeStatus) => void
  addLog: (log: ExecutionLog) => void
  setResults: (results: unknown) => void
  setShowOverlay: (show: boolean) => void
  reset: () => void
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  runId: null,
  isRunning: false,
  nodeStatuses: new Map(),
  logs: [],
  results: null,
  showOverlay: false,

  startRun: (runId) =>
    set({
      runId,
      isRunning: true,
      nodeStatuses: new Map(),
      logs: [],
      results: null,
      showOverlay: true,
    }),

  updateNodeStatus: (status) =>
    set((s) => {
      const newMap = new Map(s.nodeStatuses)
      newMap.set(status.nodeId, status)
      return { nodeStatuses: newMap }
    }),

  addLog: (log) => set((s) => ({ logs: [...s.logs, log] })),

  setResults: (results) => set({ results, isRunning: false }),

  setShowOverlay: (show) => set({ showOverlay: show }),

  reset: () =>
    set({
      runId: null,
      isRunning: false,
      nodeStatuses: new Map(),
      logs: [],
      results: null,
      showOverlay: false,
    }),
}))
