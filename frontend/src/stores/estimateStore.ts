/**
 * Estimate Store — Zustand with dual persistence (localStorage + backend API).
 */

import { create } from 'zustand'

export interface EstimatePhase {
  name: string
  hours: number
  cost: number
  resources: number
  description?: string
}

export interface EstimateCost {
  category: string
  amount: number
  description?: string
}

export interface EstimateRisk {
  risk: string
  impact: string
  likelihood: string
  mitigation?: string
}

export interface Estimate {
  id?: number
  name: string
  status: string
  total_effort_hours: number | null
  total_cost: number | null
  confidence_score: number | null
  phases: EstimatePhase[] | null
  costs: EstimateCost[] | null
  resources: unknown[] | null
  risks: EstimateRisk[] | null
  assumptions: string[] | null
  source_document: string | null
  created_at?: string
  updated_at?: string
}

interface EstimateState {
  estimates: Estimate[]
  currentEstimate: Estimate | null
  loading: boolean
  createEstimate: (est: Omit<Estimate, 'id'>) => Promise<Estimate>
  updateEstimate: (id: number, updates: Partial<Estimate>) => Promise<void>
  loadEstimate: (id: number) => Promise<Estimate | null>
  listEstimates: () => Promise<Estimate[]>
  deleteEstimate: (id: number) => Promise<void>
}

const LS_KEY = 'scoper_estimates'

function saveToLocal(estimates: Estimate[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(estimates))
  } catch {
    // quota exceeded — silently skip
  }
}

function loadFromLocal(): Estimate[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupted — ignore
  }
  return []
}

export const useEstimateStore = create<EstimateState>((set, get) => ({
  estimates: loadFromLocal(),
  currentEstimate: null,
  loading: false,

  createEstimate: async (est) => {
    set({ loading: true })
    try {
      const res = await fetch('/api/v2/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(est),
      })
      if (!res.ok) throw new Error('Failed to create estimate')
      const data = await res.json()
      const created: Estimate = { ...est, id: data.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      const updated = [created, ...get().estimates]
      saveToLocal(updated)
      set({ estimates: updated, currentEstimate: created, loading: false })
      return created
    } catch {
      // Fallback to local-only
      const localId = Date.now()
      const created: Estimate = { ...est, id: localId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      const updated = [created, ...get().estimates]
      saveToLocal(updated)
      set({ estimates: updated, currentEstimate: created, loading: false })
      return created
    }
  },

  updateEstimate: async (id, updates) => {
    set({ loading: true })
    try {
      await fetch(`/api/v2/estimates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch {
      // offline — update local only
    }
    const estimates = get().estimates.map((e) =>
      e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e,
    )
    saveToLocal(estimates)
    const current = get().currentEstimate?.id === id ? { ...get().currentEstimate!, ...updates } : get().currentEstimate
    set({ estimates, currentEstimate: current, loading: false })
  },

  loadEstimate: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/v2/estimates/${id}`)
      if (res.ok) {
        const est: Estimate = await res.json()
        set({ currentEstimate: est, loading: false })
        return est
      }
    } catch {
      // offline
    }
    // Fallback to local
    const local = get().estimates.find((e) => e.id === id) || null
    set({ currentEstimate: local, loading: false })
    return local
  },

  listEstimates: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/v2/estimates')
      if (res.ok) {
        const list: Estimate[] = await res.json()
        saveToLocal(list)
        set({ estimates: list, loading: false })
        return list
      }
    } catch {
      // offline
    }
    set({ loading: false })
    return get().estimates
  },

  deleteEstimate: async (id) => {
    try {
      await fetch(`/api/v2/estimates/${id}`, { method: 'DELETE' })
    } catch {
      // offline
    }
    const estimates = get().estimates.filter((e) => e.id !== id)
    saveToLocal(estimates)
    set({ estimates, currentEstimate: get().currentEstimate?.id === id ? null : get().currentEstimate })
  },
}))
