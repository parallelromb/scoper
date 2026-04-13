# ARIES v2.0 — Launch Posts

## LinkedIn Post

---

**I built a tool that does in 2 minutes what takes enterprise teams 2-4 weeks.**

At my last role, I watched software teams spend weeks estimating projects — reading BRDs, cross-referencing history, applying rate cards, building schedules, writing reports. Same process, every time.

So I built ARIES — an open-source AI system that does it all with 9 specialized AI agents working in a visual pipeline:

- ARIA extracts requirements from your document
- NOVA generates effort/cost/resource estimates
- CHRONOS builds the schedule
- SENTINEL flags security risks
- ...and 5 more agents, each with a specific job

You drag and drop agents onto a canvas, connect them, hit Run, and get a complete project estimate — phases, costs, resources, risks, timeline.

What makes it different:
→ Visual drag-and-drop pipeline builder (like n8n, but for estimation)
→ 28 configurable node types
→ Runs fully local with Ollama + Gemma — no API keys needed
→ 5-layer memory system so agents learn from past estimates
→ Single command: python run.py

Built with React, FastAPI, React Flow, and a lot of YAML soul files.

Open source, MIT licensed.

GitHub: https://github.com/parallelromb/aries-v2

#AI #OpenSource #ProjectManagement #SoftwareEngineering #Estimation #AgenticAI

---

## X/Twitter Post

---

I open-sourced ARIES v2.0 — a multi-agent AI system that estimates software projects in under 2 minutes.

9 AI agents. 28 pipeline nodes. Visual drag-and-drop builder. Runs fully local with Ollama.

Upload a BRD → get phases, costs, resources, risks, schedule.

python run.py

https://github.com/parallelromb/aries-v2

---

## X/Twitter Thread (alternative)

---

**Tweet 1:**
I just open-sourced ARIES v2.0 — a multi-agent AI system that turns project documents into complete resource estimates.

What takes enterprise teams 2-4 weeks, ARIES does in 2 minutes.

Here's how it works 🧵

**Tweet 2:**
ARIES has 9 specialized AI agents, each with a "soul" (YAML-defined personality, expertise, and tools):

• ARIA — Requirements Analyst
• NOVA — Estimation Engine
• CHRONOS — Schedule Planner
• SENTINEL — Security Reviewer
• ATLAS — Architecture Advisor
...and 4 more

**Tweet 3:**
The magic is the visual pipeline builder.

Drag agents onto a canvas, connect them, configure parameters, hit Run.

28 node types across 6 categories. 5 pre-built templates for common workflows.

Think n8n or Retool, but for software estimation.

**Tweet 4:**
It runs 100% local.

Ollama + Gemma 4 = no API keys, no cloud, no data leaving your machine.

Or plug in OpenAI/Anthropic/GitHub Models if you prefer.

Single command: python run.py

**Tweet 5:**
The memory system is the part I'm most proud of.

5 layers with Ebbinghaus decay — agents literally forget irrelevant information over time, just like humans.

Each estimate makes future estimates better.

**Tweet 6:**
Stack:
• React + Vite + Tailwind (frontend)
• FastAPI + SQLite (backend)
• React Flow (pipeline canvas)
• Pure TypeScript NLP (zero ML deps)
• 9 YAML agent souls + 13 skill packs

MIT licensed. Zero licensing cost.

https://github.com/parallelromb/aries-v2

---

## Hacker News — Show HN

---

**Title:** Show HN: ARIES v2.0 – Open-source multi-agent AI for software project estimation

**Body:**

Hi HN,

I built ARIES to solve a problem I kept seeing at work: software teams spending 2-4 weeks estimating projects by manually reading BRDs, cross-referencing historical data, and building spreadsheets.

ARIES runs 9 specialized AI agents in a visual drag-and-drop pipeline. Upload a document, pick a workflow template (or build your own), and get a complete estimate — phases, effort hours, costs, resources, risks, and schedule.

What's interesting technically:

- **Visual pipeline builder** using React Flow with 28 node types. You connect agents, tools, and processing nodes like a flowchart.

- **Agent "souls"** defined in YAML — each agent has a distinct personality, expertise domains, tools, and memory access levels. ARIA extracts requirements, NOVA generates estimates, CHRONOS builds schedules, SENTINEL flags security risks, etc.

- **5-layer memory system** with Ebbinghaus decay. Agents retain useful patterns from past estimates but naturally forget irrelevant information. Working memory (session), short-term (hours), episodic (days), long-term (weeks), semantic (months).

- **Runs fully local** with Ollama + Gemma 4. No API keys needed. Or connect to OpenAI/Anthropic/GitHub Models.

- **Pure TypeScript NLP engine** — TF-IDF, cosine similarity, domain detection, topic classification. Zero ML library dependencies.

- **Single command deployment** — `python run.py` serves the React SPA + FastAPI backend on one port.

Stack: React + Vite + Tailwind + React Flow (frontend), FastAPI + SQLite (backend), Zustand (state), Recharts (viz).

Originally built for an internal innovation competition, now cleaned up and open-sourced. Hardware-agnostic — runs on macOS, Linux, or any cloud VM.

GitHub: https://github.com/parallelromb/aries-v2

Happy to answer questions about the agent architecture or the pipeline execution model.
