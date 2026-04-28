# Scoper Launch Posts

---

## 1. LinkedIn Post

Every agency has this moment.

A new RFP lands. 47 pages. Due Friday. And someone has to sit in a room for 3 days producing an estimate that's still going to be wrong by 40%.

I've been on both sides of this. The person guessing. The person explaining why the guess was off. It's painful every time.

So I built Scoper.

Upload a BRD, SOW, or Jira export. Nine AI agents run in a visual pipeline — each handling a specific dimension of estimation — and you get a complete project estimate in under 2 minutes.

Not a single prompt. Not a chatbot. A pipeline.

The 9 agents:
- ARIA breaks down requirements
- NOVA calculates effort and cost
- SENTINEL flags security risks
- ATLAS designs the architecture
- CHRONOS builds the schedule
- ORACLE checks historical patterns
- NEXUS maps integrations
- PRISM defines quality gates
- FORGE plans DevOps and infrastructure

Each agent's output feeds into the next. You can watch them work in a React Flow visual canvas — drag, rearrange, inspect intermediate outputs.

The result: phases, effort hours, cost estimates, resource allocation, risk register, and a realistic schedule. The kind of document that used to take a senior team a week.

Is it perfect? No. Estimation never is. But it gives you a solid 80% baseline in minutes instead of days. Your senior people review and adjust rather than start from scratch.

It's open source. MIT license. Self-hosted. Your data never leaves your machine.

Stack: React + Vite + Tailwind + React Flow on the frontend, FastAPI + SQLite on the backend, 9 YAML-defined agents you can customize.

If you're at an agency or consultancy that responds to RFPs, give it a spin. Star it if it's useful.

github.com/parallelromb/scoper

---

## 2. X/Twitter Thread

**Tweet 1:**
Every agency wastes 3-5 days estimating projects from RFPs. What if 9 AI agents could do it in 2 minutes?

I built Scoper — upload a BRD/SOW, watch a visual agent pipeline produce a full project estimate.

Open source, MIT, self-hosted.

github.com/parallelromb/scoper

**Tweet 2:**
The 9 agents, each handling one dimension:

ARIA — decomposes requirements into tasks
NOVA — estimates effort + cost per task
SENTINEL — flags security concerns early
ATLAS — proposes architecture decisions

**Tweet 3:**
CHRONOS — builds a realistic schedule with dependencies
ORACLE — cross-references historical estimation patterns
NEXUS — identifies integration points and complexity
PRISM — defines quality gates and testing strategy

**Tweet 4:**
FORGE — plans CI/CD, infrastructure, and DevOps needs

Each agent's output feeds the next. You watch them work in a React Flow canvas. Drag nodes, inspect intermediate outputs, re-run individual agents.

**Tweet 5:**
The output: phases, effort breakdown, cost estimates, resource plan, risk register, schedule with milestones.

The kind of SOW response that used to take a senior team a full week. Now it's a starting point you get in 2 minutes.

**Tweet 6:**
Fully open source. MIT license. Self-hosted — your documents never leave your machine.

Stack: React + Vite + Tailwind + React Flow (frontend), FastAPI + SQLite (backend), agents defined in YAML so you can customize them.

**Tweet 7:**
If you're at an agency, consultancy, or SI that responds to RFPs — try it:

github.com/parallelromb/scoper

Star it, fork it, tell me what's missing. DMs open.

---

## 3. Hacker News — Show HN

### Title Variants

1. Show HN: Scoper – 9 AI agents that estimate software projects from BRDs in 2 min
2. Show HN: Scoper – Turn RFPs into project estimates with a visual AI agent pipeline
3. Show HN: Scoper – Open-source project estimation using 9 specialized AI agents

### Body

**What:** Scoper takes a BRD, SOW, or Jira export and produces a complete project estimate (phases, effort, costs, resources, risks, schedule) using 9 AI agents running in a visual pipeline.

**Why:** I've worked at agencies where estimation meant locking 3 senior people in a room for a week. The output was still wrong. The industry standard for estimation accuracy is pretty bad — most projects overshoot by 30-50%. I wanted a tool that gives you a solid first-pass baseline so your humans can refine rather than start from zero.

**How it works:** Each agent handles one dimension — requirements decomposition (ARIA), effort calculation (NOVA), security analysis (SENTINEL), architecture (ATLAS), scheduling (CHRONOS), historical patterns (ORACLE), integration mapping (NEXUS), quality planning (PRISM), and DevOps (FORGE). Agents are defined in YAML files so you can modify prompts, add new agents, or change the pipeline flow. The frontend uses React Flow so you can visually trace data through the pipeline.

**Stack:** React + Vite + Tailwind + React Flow (frontend), FastAPI + SQLite (backend). Runs locally against any OpenAI-compatible LLM endpoint (Ollama, vLLM, OpenAI, Anthropic).

**What's next:** Better prompt tuning based on real-world SOWs, export to common formats (PDF/DOCX), team estimation mode with multiple reviewers.

MIT license, self-hosted, no telemetry.

GitHub: https://github.com/parallelromb/scoper

### Prepared FAQ Answers

**Q: How accurate is it compared to manual estimation?**
A: In my testing with real BRDs from past projects, it gets within 20-30% of what the actual team estimated — but in minutes rather than days. The point isn't to replace senior judgment, it's to give you a structured baseline so your team reviews and adjusts instead of starting from scratch. The risk register alone saves hours.

**Q: Does it support local LLMs?**
A: Yes. It works with any OpenAI-compatible endpoint. I run it with Ollama locally (Llama 3, Gemma, etc.). You can also point it at OpenAI, Anthropic, or any hosted inference. Your documents never leave your machine if you use a local model.

**Q: How is this better than just prompting ChatGPT with my BRD?**
A: Three things. (1) Structured pipeline — 9 focused agents produce better results than one monolithic prompt. (2) Visual traceability — you see exactly which agent produced which output and can re-run individual steps. (3) Consistency — same document in, same structured output format out, every time. A single LLM call gives you prose; Scoper gives you a structured estimate with phases, costs, risks, and schedule.

**Q: What kind of documents can I upload?**
A: Anything text-based that describes project requirements. BRDs, SOWs, RFP responses, Jira CSV exports, PRDs, user story maps in markdown. The first agent (ARIA) handles requirement extraction from unstructured text.

---

## 4. r/SideProject Post

**Title:** I built an AI that estimates software projects using 9 specialized agents

**Body:**

I've spent years at agencies where project estimation meant locking senior devs in a room for days. The output was always a spreadsheet that was wrong by 40%.

So I built Scoper.

Upload any BRD, SOW, or Jira export. Nine AI agents — each specialized in one dimension (requirements, effort, security, architecture, scheduling, historical patterns, integrations, quality, DevOps) — run in sequence, each feeding the next.

The result: a full project estimate with phases, effort hours, cost breakdown, resource plan, risk register, and schedule. In about 2 minutes.

The frontend uses React Flow so you can actually see the pipeline working — nodes light up as each agent processes, and you can click into any node to see its intermediate output.

[Screenshot: pipeline visualization with 9 agent nodes connected]

**Tech stack:**
- Frontend: React + Vite + Tailwind + React Flow
- Backend: FastAPI + SQLite
- Agents: defined in YAML files (easy to customize)
- Works with any OpenAI-compatible LLM (Ollama, OpenAI, etc.)

It's fully open source (MIT), self-hosted, no telemetry. Your documents stay on your machine.

Repo: github.com/parallelromb/scoper

Would love feedback, especially from anyone who does estimation professionally. What's missing?

---

## 5. Dev.to Article Outline

**Title:** How I Built a 9-Agent Pipeline for Project Estimation

### Section 1: The Problem with Software Estimation
- Industry-wide pain: 30-50% overrun is normal
- Manual process: 3-5 senior people, 3-7 days, still inaccurate
- Why single-prompt AI approaches fall short (context window limits, lack of structure, no traceability)

### Section 2: Why a Multi-Agent Pipeline
- Decomposition principle: narrow focus produces better outputs than broad prompts
- Each agent is an expert in one dimension
- Pipeline architecture: sequential with feedback loops
- YAML-defined agents: prompt, inputs, outputs, dependencies — all configurable

### Section 3: The 9 Agents — What Each Does and Why
- Walk through the pipeline in order: ARIA > NOVA > SENTINEL > ATLAS > CHRONOS > ORACLE > NEXUS > PRISM > FORGE
- Show a sample YAML agent definition
- Explain how output schema of one agent becomes input context for the next
- Why this order matters (requirements must come before effort, architecture before DevOps)

### Section 4: Building the Visual Pipeline (React Flow)
- Why visualization matters for trust and debugging
- React Flow node types: agent nodes, data nodes, output nodes
- Real-time status updates as agents execute
- Allowing users to re-run individual agents without restarting the whole pipeline
- Code snippets: custom node components, edge animations, state management

### Section 5: What I Learned and What's Next
- Prompt engineering for structured output is hard — YAML schema enforcement helps
- Local LLMs (7B-13B) work surprisingly well for most agents; architecture agent benefits from larger models
- SQLite is fine for single-user/small-team — no need for Postgres at this scale
- Next steps: PDF/DOCX export, team review mode, fine-tuning on real estimation data, benchmark against historical projects
- Open source philosophy: MIT license, self-hosted, no vendor lock-in
