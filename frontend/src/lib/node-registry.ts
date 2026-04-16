export type NodeCategory = 'input' | 'agent' | 'tool' | 'processing' | 'output' | 'optimize'

export interface NodePort {
  inputs: string[]
  outputs: string[]
}

export interface NodeDefinition {
  id: string
  category: NodeCategory
  subtype: string
  label: string
  description: string
  icon: string
  color: string
  defaultConfig: Record<string, unknown>
  ports: NodePort
}

const definitions: NodeDefinition[] = [
  // ── Input Sources (blue/sky) ──
  {
    id: 'document_upload',
    category: 'input',
    subtype: 'document',
    label: 'Document Upload',
    description: 'Upload PDF, DOCX, or XLSX files for analysis',
    icon: 'FileUp',
    color: 'sky',
    defaultConfig: { content: '', fileName: '', fileType: '' },
    ports: { inputs: [], outputs: ['document'] },
  },
  {
    id: 'api_input',
    category: 'input',
    subtype: 'api',
    label: 'API Input',
    description: 'Fetch requirements from an external API endpoint',
    icon: 'Globe',
    color: 'sky',
    defaultConfig: { url: '', method: 'GET', headers: '{}', body: '' },
    ports: { inputs: [], outputs: ['data'] },
  },
  {
    id: 'jira_import',
    category: 'input',
    subtype: 'jira',
    label: 'Jira Import',
    description: 'Import epics and stories from Jira',
    icon: 'Ticket',
    color: 'sky',
    defaultConfig: { projectKey: '', jqlFilter: '', maxResults: 100 },
    ports: { inputs: [], outputs: ['issues'] },
  },
  {
    id: 'manual_entry',
    category: 'input',
    subtype: 'manual',
    label: 'Manual Entry',
    description: 'Manually type or paste requirements text',
    icon: 'PenLine',
    color: 'sky',
    defaultConfig: { content: '', format: 'text' },
    ports: { inputs: [], outputs: ['text'] },
  },

  // ── AI Agents (violet/purple) ──
  {
    id: 'aria',
    category: 'agent',
    subtype: 'analyst',
    label: 'ARIA',
    description: 'Requirements Analyst — extracts and structures project requirements',
    icon: 'ScanSearch',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.3, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['document', 'text', 'data'], outputs: ['requirements'] },
  },
  {
    id: 'nova',
    category: 'agent',
    subtype: 'estimator',
    label: 'NOVA',
    description: 'Estimation Engine — generates effort, cost, and timeline estimates',
    icon: 'Calculator',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.5, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['requirements', 'data'], outputs: ['estimate'] },
  },
  {
    id: 'sentinel',
    category: 'agent',
    subtype: 'reviewer',
    label: 'SENTINEL',
    description: 'Risk Analyst — identifies risks, assumptions, and mitigation strategies',
    icon: 'ShieldAlert',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.4, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['requirements', 'estimate'], outputs: ['risks'] },
  },
  {
    id: 'atlas',
    category: 'agent',
    subtype: 'architect',
    label: 'ATLAS',
    description: 'Technical Architect — evaluates architecture and technical complexity',
    icon: 'Network',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.3, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['requirements'], outputs: ['architecture'] },
  },
  {
    id: 'chronos',
    category: 'agent',
    subtype: 'scheduler',
    label: 'CHRONOS',
    description: 'Timeline Planner — builds Gantt-style phase schedules with dependencies',
    icon: 'Clock',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.3, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['estimate', 'requirements'], outputs: ['timeline'] },
  },
  {
    id: 'oracle',
    category: 'agent',
    subtype: 'advisor',
    label: 'ORACLE',
    description: 'Historical Advisor — compares against past estimates for calibration',
    icon: 'Brain',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.5, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['estimate', 'requirements'], outputs: ['insights'] },
  },
  {
    id: 'nexus',
    category: 'agent',
    subtype: 'integrator',
    label: 'NEXUS',
    description: 'Integration Specialist — analyzes integration points and API dependencies',
    icon: 'Unplug',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.3, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['requirements', 'architecture'], outputs: ['integrations'] },
  },
  {
    id: 'prism',
    category: 'agent',
    subtype: 'resource',
    label: 'PRISM',
    description: 'Resource Planner — plans team composition, skills, and allocation',
    icon: 'Users',
    color: 'violet',
    defaultConfig: { model: '', temperature: 0.4, maxTokens: 4096, systemPrompt: '' },
    ports: { inputs: ['estimate', 'timeline'], outputs: ['resources'] },
  },

  // ── Tools (amber) ──
  {
    id: 'rate_card',
    category: 'tool',
    subtype: 'rates',
    label: 'Rate Card',
    description: 'Apply hourly rate cards by role and region to effort estimates',
    icon: 'CreditCard',
    color: 'amber',
    defaultConfig: { rateTable: 'default', currency: 'USD' },
    ports: { inputs: ['estimate', 'resources'], outputs: ['costed'] },
  },
  {
    id: 'calendar',
    category: 'tool',
    subtype: 'calendar',
    label: 'Calendar',
    description: 'Map timeline against business calendar and holidays',
    icon: 'CalendarDays',
    color: 'amber',
    defaultConfig: { region: 'US', holidays: true },
    ports: { inputs: ['timeline'], outputs: ['schedule'] },
  },
  {
    id: 'template_tool',
    category: 'tool',
    subtype: 'template',
    label: 'Template',
    description: 'Apply a document template to format output',
    icon: 'FileText',
    color: 'amber',
    defaultConfig: { templateId: '', format: 'pdf' },
    ports: { inputs: ['data'], outputs: ['formatted'] },
  },
  {
    id: 'export_tool',
    category: 'tool',
    subtype: 'export',
    label: 'Export',
    description: 'Export data to CSV, JSON, or XML formats',
    icon: 'Download',
    color: 'amber',
    defaultConfig: { format: 'json' },
    ports: { inputs: ['data'], outputs: ['file'] },
  },

  // ── Processing (emerald/green) ──
  {
    id: 'decision_gate',
    category: 'processing',
    subtype: 'gate',
    label: 'Decision Gate',
    description: 'Conditional branch based on confidence threshold or value comparison',
    icon: 'GitBranch',
    color: 'emerald',
    defaultConfig: { threshold: 0.7, operator: '>=', field: 'confidence_score' },
    ports: { inputs: ['data'], outputs: ['pass', 'fail'] },
  },
  {
    id: 'checkpoint',
    category: 'processing',
    subtype: 'checkpoint',
    label: 'Checkpoint',
    description: 'Save intermediate state for recovery and audit trail',
    icon: 'Save',
    color: 'emerald',
    defaultConfig: { label: 'Checkpoint' },
    ports: { inputs: ['data'], outputs: ['data'] },
  },
  {
    id: 'merge',
    category: 'processing',
    subtype: 'merge',
    label: 'Merge',
    description: 'Combine outputs from multiple upstream nodes into one payload',
    icon: 'Merge',
    color: 'emerald',
    defaultConfig: { strategy: 'concat' },
    ports: { inputs: ['data_a', 'data_b'], outputs: ['merged'] },
  },
  {
    id: 'filter',
    category: 'processing',
    subtype: 'filter',
    label: 'Filter',
    description: 'Filter or transform data based on rules before passing downstream',
    icon: 'Filter',
    color: 'emerald',
    defaultConfig: { rules: '[]' },
    ports: { inputs: ['data'], outputs: ['filtered'] },
  },

  // ── Output (slate) ──
  {
    id: 'report',
    category: 'output',
    subtype: 'report',
    label: 'Report',
    description: 'Generate a comprehensive estimation report',
    icon: 'FileBarChart',
    color: 'slate',
    defaultConfig: { format: 'pdf', includeCharts: true },
    ports: { inputs: ['estimate', 'data', 'merged'], outputs: [] },
  },
  {
    id: 'dashboard_output',
    category: 'output',
    subtype: 'dashboard',
    label: 'Dashboard',
    description: 'Push results to the Scoper dashboard for visualization',
    icon: 'LayoutDashboard',
    color: 'slate',
    defaultConfig: { autoRefresh: true },
    ports: { inputs: ['estimate', 'data', 'merged'], outputs: [] },
  },
  {
    id: 'excel',
    category: 'output',
    subtype: 'excel',
    label: 'Excel Export',
    description: 'Export estimate data to a formatted Excel spreadsheet',
    icon: 'Sheet',
    color: 'slate',
    defaultConfig: { sheets: ['summary', 'phases', 'costs'], includeCharts: false },
    ports: { inputs: ['estimate', 'data', 'merged'], outputs: [] },
  },
  {
    id: 'html_output',
    category: 'output',
    subtype: 'html',
    label: 'HTML Output',
    description: 'Render results as a styled HTML page for sharing',
    icon: 'Code',
    color: 'slate',
    defaultConfig: { theme: 'light', branding: true },
    ports: { inputs: ['estimate', 'data', 'merged'], outputs: [] },
  },

  // ── Optimize (cyan) ──
  {
    id: 'cache',
    category: 'optimize',
    subtype: 'cache',
    label: 'Cache',
    description: 'Cache agent outputs to avoid redundant LLM calls on re-runs',
    icon: 'Database',
    color: 'cyan',
    defaultConfig: { ttlMinutes: 60, keyStrategy: 'content-hash' },
    ports: { inputs: ['data'], outputs: ['data'] },
  },
  {
    id: 'parallel',
    category: 'optimize',
    subtype: 'parallel',
    label: 'Parallel',
    description: 'Execute downstream branches in parallel for faster throughput',
    icon: 'Layers',
    color: 'cyan',
    defaultConfig: { maxConcurrency: 3 },
    ports: { inputs: ['data'], outputs: ['data'] },
  },
  {
    id: 'retry',
    category: 'optimize',
    subtype: 'retry',
    label: 'Retry',
    description: 'Retry failed nodes with configurable backoff and max attempts',
    icon: 'RefreshCw',
    color: 'cyan',
    defaultConfig: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
    ports: { inputs: ['data'], outputs: ['data'] },
  },
  {
    id: 'validate',
    category: 'optimize',
    subtype: 'validate',
    label: 'Validate',
    description: 'Validate node output against a JSON schema or business rules',
    icon: 'CheckCircle',
    color: 'cyan',
    defaultConfig: { schema: '{}', rules: '[]' },
    ports: { inputs: ['data'], outputs: ['valid', 'invalid'] },
  },
]

export const nodeRegistry = new Map<string, NodeDefinition>(
  definitions.map((d) => [d.id, d])
)

export function getNodesByCategory(category?: NodeCategory): NodeDefinition[] {
  if (!category) return definitions
  return definitions.filter((d) => d.category === category)
}

export function getNodeDef(type: string): NodeDefinition | undefined {
  return nodeRegistry.get(type)
}

export const categoryMeta: Record<NodeCategory, { label: string; color: string; iconName: string }> = {
  input: { label: 'Input Sources', color: 'sky', iconName: 'ArrowDownToLine' },
  agent: { label: 'AI Agents', color: 'violet', iconName: 'Bot' },
  tool: { label: 'Tools', color: 'amber', iconName: 'Wrench' },
  processing: { label: 'Processing', color: 'emerald', iconName: 'Workflow' },
  output: { label: 'Output', color: 'slate', iconName: 'ArrowUpFromLine' },
  optimize: { label: 'Optimize', color: 'cyan', iconName: 'Zap' },
}
