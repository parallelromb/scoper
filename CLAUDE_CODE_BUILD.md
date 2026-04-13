# ARIES v2.0 — Claude Code Build Specification

> Complete build instruction file for Claude Code. Run each phase sequentially. Confirm `python run.py` boots clean after each phase before proceeding.

## Platform Requirements

- **OS:** Any — macOS, Linux, Windows (WSL2), or cloud VM
- **Python:** 3.10+
- **Node.js:** 18+ (for frontend build)
- **Database:** SQLite (auto-created, no setup needed)
- **LLM:** Configurable — OpenAI, Anthropic, GitHub Models, or Ollama (local)

No Docker required. No platform-specific dependencies.

---

## Phase 1: Foundation

### 1.1 Frontend Scaffold
```
npx create-vite frontend --template react-ts
cd frontend
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom zustand
npm install @xyflow/react                    # install now, use in Phase 3
npm install lucide-react recharts
npm install clsx tailwind-merge
```

### 1.2 Tailwind Config
Configure Tailwind with custom design tokens:
- **Colors:** Slate-based dark mode, blue primary, violet agents, amber tools, emerald success, rose error
- **Fonts:** Inter (sans), Cascadia Code / Fira Code (mono)
- **Dark mode:** class-based toggle (`dark:` prefix)

### 1.3 FastAPI Backend
```
pip install fastapi uvicorn python-multipart aiofiles pyyaml python-dotenv
```

Create `server/app.py`:
- FastAPI app with CORS middleware
- Static file serving for SPA (static/dist/)
- SPA catch-all route for client-side routing
- Auto-create SQLite database on startup with WAL mode

Create `server/config.py`:
- Load `.env` with python-dotenv
- Paths: DATA_DIR, DB_PATH, UPLOAD_DIR
- LLM config: provider, api_key, model, ollama_host

### 1.4 SQLite Schema (auto-migration on startup)
Core tables — auto-created if not exist:
- `users` (id, username, display_name, role, created_at, last_login)
- `estimates` (id, name, status, total_effort_hours, total_cost, confidence_score, phases JSON, costs JSON, resources JSON, risks JSON, assumptions JSON, source_document, created_by, created_at, updated_at)
- `estimate_versions` (id, estimate_id, version, data JSON, change_summary, created_by, created_at)
- `pipeline_graphs` (id, name, graph JSON, created_by, created_at, updated_at)
- `pipeline_runs` (id, pipeline_id, status, started_at, completed_at, total_tokens, latency_ms, node_results JSON, error)
- `audit_log` (id, entity_type, entity_id, action, details JSON, user_id, created_at)
- `memories` (id, agent_id, layer, content, importance, quality, outcome, created_at, last_accessed, decay_rate)
- `artifacts` (id, run_id, agent_id, type, content JSON, created_at)

### 1.5 Authentication
- `POST /api/auth/login` — accepts `{ username }`, auto-registers, sets `aries_session` cookie (HTTPOnly, 24h TTL, SameSite=Lax)
- `POST /api/auth/logout` — clears cookie
- `GET /api/auth/me` — returns current user
- `AuthMiddleware` validates all `/api/*` except `/api/auth/login`
- RBAC roles: admin, estimator, viewer (stored in users table)

### 1.6 AppShell Layout
- Top navbar: ARIES logo, nav links, theme toggle (sun/moon), user menu
- Collapsible sidebar: same nav links with icons
- Content area with `<Outlet />`
- Zustand `authStore`: user, login(), logout(), checkSession()
- Zustand `themeStore`: dark/light toggle, persisted to localStorage

### 1.7 React Router
Protected routes (redirect to /login if no session):
- `/` — Home
- `/quick-estimate` — Quick Estimate
- `/pipeline` — Pipeline Builder
- `/dashboard` — Dashboard
- `/estimates/:id` — Estimate Detail
- `/update-estimate/:id` — Update Estimate
- `/login` — Login (public)

### 1.8 Entry Point
`run.py`:
```python
import uvicorn
uvicorn.run("server.app:app", host="0.0.0.0", port=8000, reload=False)
```

**Checkpoint:** `python run.py` serves the SPA on port 8000, login works, cookie is set.

---

## Phase 2: Core Estimation

### 2.1 Home Page (`/`)
Three mode-selector cards in a centered grid:
- **Quick Estimate** — "Upload a document and get an estimate in minutes"
- **Build Estimate** — "Configure a custom pipeline with drag-and-drop"
- **Update Existing** — "Browse and refine existing estimates"

Below: recent estimates list (5 most recent) + app stats bar (total estimates, success rate, avg confidence).

### 2.2 LLM Service (`services/llmChat.ts`)
Configurable provider routing — detect from `/api/config` endpoint:
- **OpenAI:** POST to OpenAI chat completions API
- **Anthropic:** POST to Anthropic messages API
- **GitHub Models:** POST to GitHub Models inference API
- **Ollama:** POST to `{OLLAMA_HOST}/api/chat`

Backend chat proxy at `POST /api/v2/chat`:
- Reads LLM_PROVIDER from config
- Routes to appropriate provider
- Returns streaming or complete response
- Handles errors gracefully with provider-specific messages

`parseJSONResponse()` with 4 fallback strategies:
1. Direct `JSON.parse()`
2. Extract from markdown code fence
3. Regex extract `{...}` or `[...]`
4. Best-effort key-value extraction

### 2.3 Quick Estimate Page (`/quick-estimate`)
5-step wizard flow:
1. **Upload** — drag-drop zone, client-side PDF/DOCX/XLSX text extraction
2. **Analyze** — NLP runs TF-IDF, domain detection, topic classification, shows badges
3. **Extract** — ARIA agent extracts structured requirements (progress spinner)
4. **Estimate** — NOVA agent generates estimate with phases/effort/cost/resources
5. **Results** — summary cards, phase breakdown table, cost table, risk list, export buttons (Save, Excel, HTML)

Floating inline chat panel for follow-up questions.

### 2.4 Estimate Store (`stores/estimateStore.ts`)
Zustand store with dual persistence:
- `localStorage` for offline access
- Backend API (`POST /api/v2/estimates`, `GET /api/v2/estimates/:id`)
- Actions: createEstimate, updateEstimate, loadEstimate, listEstimates

### 2.5 Dashboard (`/dashboard`)
Two view modes (tab toggle):
1. **Command Center** — KPI cards (Total Runs, Success Rate, Active, Avg Duration, Tokens), status doughnut chart (Recharts), runs-by-pipeline bar chart, recent runs table
2. **Estimation** — stats cards, confidence/phase distribution charts, searchable estimate list with status filters, click-through to detail

### 2.6 Estimate Detail (`/estimates/:id`)
Read-only viewer:
- Header: name, status badge, confidence meter (colored arc)
- Stats row: hours, duration, cost, phases count
- 8 tabs: Summary, Phases, Resources, Costs, Risks, Timeline, Versions (history with change summaries), Audit (full trail)

### 2.7 NLP Engine (`lib/nlp.ts`)
Pure TypeScript, zero dependencies:
- **Tokenize** → remove 120+ stop words → light stemming (-ing, -tion, -ment, -ed, -er, -ness)
- **TF-IDF** vectorization with L2 normalization
- **Cosine similarity** via dot product of normalized vectors
- **Domain detection** — weighted keyword vocabularies (payments, lending, wealth, insurance, etc.)
- **Topic classification** — keyword classifiers (infrastructure, data_migration, api_integration, ui_development, security, testing)
- **Text fingerprinting** — 128-bit hash for dedup

**Checkpoint:** Quick Estimate flow works end-to-end with chosen LLM provider. Dashboard shows data.

---

## Phase 3: Pipeline Builder

### 3.1 React Flow Setup
Configure `@xyflow/react` with:
- Snap-to-grid (20px)
- Mini-map (bottom-right)
- Background dots pattern
- Connection validation (prevent cycles, type-check ports)

### 3.2 Node Registry (`lib/node-registry.ts`)
28 node types, each with: category, subtype, label, description, icon, color, defaultConfig, ports (inputs/outputs).

**Categories & Colors:**
- Input Sources (4, blue): document_upload, api_input, jira_import, manual_entry
- AI Agents (8, violet): aria, nova, sentinel, atlas, chronos, oracle, nexus, prism
- Tools (4, amber): rate_card, calendar, template_tool, export_tool
- Processing (4, green): decision_gate, checkpoint, merge, filter
- Output (4, slate): report, dashboard_output, excel, html_output
- Optimize (4, cyan): cache, parallel, retry, validate

### 3.3 BaseNode Component
Styled card matching category color. Shows:
- Icon + label
- Status indicator (queued/running/done/error)
- Input/output connection handles
- Rich hover tooltip (description, port info, output preview after execution)
- Inline output preview badge after execution

### 3.4 Node Palette (left panel)
- Search/filter input
- 5 workflow template buttons (click to auto-place)
- 6 collapsible category sections
- Each node is draggable onto the canvas

### 3.5 Pipeline Builder Page (`/pipeline`)
3-panel layout:
- **Left:** Node Palette (collapsible, 280px)
- **Center:** React Flow canvas with floating toolbar
- **Right:** Properties Panel (collapsible, 320px)

### 3.6 Properties Panel (right panel)
Dynamic configuration form per selected node type:
- Agent nodes: LLM model selector, temperature slider, max tokens, system prompt override
- Decision gates: threshold value, comparison operator
- Output nodes: format options, template selection
- All nodes: label edit, description, notes

### 3.7 Canvas Toolbar (floating)
Buttons: Save, Load, Run, Import JSON, Export JSON, Zoom In/Out/Fit, Clear Canvas

### 3.8 Stores
- `pipelineStore`: nodes, edges, selectedNode, addNode, removeNode, updateNode, saveGraph, loadGraph
- `executionStore`: runId, nodeStatuses, logs, results, isRunning, startRun, updateNodeStatus

### 3.9 Pipeline Executor (`lib/pipeline-executor.ts`)
1. Generate execution ID, set all nodes to "queued"
2. Auto-save graph to backend, create run record
3. **Topological sort** (Kahn's algorithm) for execution order
4. For each node in order:
   - Set status → running
   - Gather upstream outputs from connected nodes
   - Execute by category:
     - **Input:** return metadata (file_name, uploaded, content)
     - **Agent:** build system prompt (role + upstream context) → `llmChat()` → parse JSON → accumulate in `agentOutputs[]`
     - **Tool:** pass-through upstream data with `_tool_applied` flag
     - **Processing:** decision gate (threshold check), checkpoint (save state), merge, filter
     - **Output:** merge all `agentOutputs` → `buildEstimateFromPipelineData()` → save to `estimateStore`
   - Set status → done (or error)
5. Update run record with total tokens, latency, per-node results

### 3.10 Execution Overlay
Slide-up panel during/after execution with two tabs:
- **Logs:** real-time per-node execution log with timestamps
- **Results:** final estimate summary, link to full estimate detail

**Checkpoint:** Can build a pipeline, run it, and get an estimate. Nodes show status during execution.

---

## Phase 4: Workflows & Polish

### 4.1 Workflow Templates (`lib/workflow-templates.ts`)
5 pre-built configurations. Clicking a template auto-places nodes with correct connections:

| Template | Nodes | Layout |
|----------|-------|--------|
| Quick Estimate | doc_upload → aria → nova → report | Linear, 4 nodes |
| Standard | doc_upload → aria → nova → chronos → prism → report + excel | 6 nodes, fork at end |
| Enterprise | doc_upload → aria → [nova, sentinel, atlas, chronos, nexus, prism, forge, oracle] → merge → report + excel + html | Hub-and-spoke |
| Re-Estimate | manual_entry → oracle → nova → sentinel → report | Linear, 5 nodes |
| Jira Import | jira_import → aria → nova → chronos → excel | Linear, 5 nodes |

### 4.2 Graph Validator (`lib/graph-validator.ts`)
Validate before execution:
- DAG check (no cycles)
- All required input ports connected
- At least one input and one output node
- All agent nodes have valid LLM config
- Return array of errors/warnings

### 4.3 Graph Serializer (`lib/graph-serializer.ts`)
- `exportGraph()` → JSON file download (nodes, edges, metadata)
- `importGraph()` → JSON file upload, validate, place on canvas

### 4.4 Update Estimate Page (`/update-estimate/:id`)
- Load existing estimate into editable form
- Edit: name, status, phases (add/edit/remove), costs, resources
- "Re-Estimate with AI" button: runs NOVA with current data as context
- Save: creates version snapshot + audit log entry

### 4.5 Version History & Audit Trail
- `GET /api/v2/estimates/:id/versions` — list all versions with change summaries
- `GET /api/v2/audit?entity_type=estimate&entity_id=:id` — full audit trail
- Displayed in Estimate Detail tabs (Versions, Audit)

### 4.6 Production Build
```bash
cd frontend && npm run build    # outputs to static/dist/
```
FastAPI serves `static/dist/` as SPA. Single port, single process.

**Checkpoint:** All 5 templates work. Import/export works. Version history shows diffs.

---

## Phase 5: Agentic Backend

### 5.1 Agent Soul YAMLs (`backend/agents/souls/`)
9 YAML files, each defining:
```yaml
id: aria
name: ARIA
role: Requirements Analyst
description: Extract and structure project requirements
constitution:
  - Always identify gaps and ambiguities
  - Classify complexity on a 3-tier scale
  - Output structured JSON
expertise:
  - requirements_analysis
  - gap_identification
  - complexity_assessment
tools:
  - document_parser
  - requirement_extractor
memory_access:
  read: [working, short_term, semantic]
  write: [working, short_term]
system_prompt: |
  You are {name}, an AI {role}. {description}.
  ...
```

### 5.2 Skill Pack YAMLs (`backend/agents/skills/`)
13 YAML files defining reusable skill templates that agents can invoke (document parsing, cost calculation, risk scoring, etc.)

### 5.3 Agent Executor (`backend/orchestrator/executor.py`)
- Load soul YAML for agent
- Build system prompt with role + context
- Call LLM via configured provider (same routing as frontend)
- Parse JSON response
- Write results to memory (appropriate layer)
- Return structured output

### 5.4 Pipeline Orchestrator (`backend/orchestrator/pipeline.py`)
- Receive pipeline graph from frontend (via service bridge)
- Topological sort for execution order
- Execute agents in order, passing outputs downstream
- Support parallel execution for independent branches
- Collect all results, build final estimate

### 5.5 Service Bridge (`backend/services/bridge.py`)
Connects frontend pipeline execution to backend agent layer:
- `POST /api/v2/agents/execute` — run a single agent with context
- `POST /api/v2/pipeline/execute` — run full pipeline server-side
- WebSocket support for real-time status updates

### 5.6 Memory System (`backend/services/memory.py`)
5 layers: working, short_term, long_term, semantic, episodic

**Ebbinghaus Decay:**
```python
new_importance = importance * (0.5 ** (elapsed_days / half_life_days))
```

Each memory has: importance (0–1), quality (0–1), outcome (0–1).
Memories below threshold are pruned during retrieval.

**API Routes:**
- `GET /api/v2/memories?agent_id=&layer=` — retrieve (with decay applied)
- `POST /api/v2/memories` — store new memory
- `DELETE /api/v2/memories/:id` — remove

### 5.7 Inter-Agent Communication
Agents can:
- `send_message(agent_id, insight)` — direct message
- `read_messages()` — check inbox
- `delegate_task(agent_id, query)` — hand off work
- `broadcast_insight(insight)` — notify all agents

Stored in `artifacts` table with type `message`.

### 5.8 Backend Routes
- `POST /api/v2/chat` — LLM chat proxy (provider-routed)
- `POST /api/v2/agents/execute` — single agent execution
- `POST /api/v2/pipeline/execute` — full pipeline execution
- `GET /api/v2/memories` — retrieve memories
- `POST /api/v2/memories` — store memory
- `GET /api/v2/artifacts?run_id=` — execution artifacts

**Checkpoint:** Backend agents produce same quality output as frontend execution. Memory persists across sessions.

---

## Environment Variables (`.env.example`)

```env
# LLM Provider: openai | anthropic | github | ollama
LLM_PROVIDER=ollama
LLM_API_KEY=
LLM_MODEL=

# Ollama (when LLM_PROVIDER=ollama)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3:27b

# Server
PORT=8000
HOST=0.0.0.0

# Database
DB_PATH=data/agentlab.db

# Auth
SESSION_TTL_HOURS=24
DEFAULT_ROLE=estimator

# Upload
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=data/uploads

# Telemetry
TELEMETRY_ENABLED=false

# Smara Memory API (optional)
SMARA_API_URL=
SMARA_API_KEY=
```

---

*Build specification generated with Claude Code — ARIES v2.0 — MIT License*
