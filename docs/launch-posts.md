# Scoper — Launch Posts

## LinkedIn Post

---

**I built an open-source tool that turns a client RFP into a priced Statement of Work in under 2 minutes.**

If you run an agency, consultancy, or SI, you know the drill. An RFP lands in your inbox. Your sales lead wants a proposal "by Friday." Three of your senior people spend the next two days reading requirements, applying rate cards, cross-referencing past engagements, and arguing over effort numbers. Rinse, repeat, every pitch.

I built Scoper — an open-source AI system that does the estimating grunt work, so your senior people can focus on the part only humans can do: judgment, relationship, and strategy.

Nine specialist AI agents run through a visual pipeline:

- ARIA extracts scope items from the RFP
- NOVA runs effort and cost estimates against your rate card
- CHRONOS builds the delivery schedule
- SENTINEL flags compliance and security risks
- ...and 5 more, each with a defined job

You drag agents onto a canvas, plug in your rate card, hit Run, and get a defensible SOW — phases, hours, costs, resources, risks, timeline — with a full audit trail you can show the client.

What makes Scoper right for agencies:

→ **Runs fully local with Ollama.** Client IP never leaves your machine — no SaaS, no API keys, no NDA breach risk.
→ **Your rate card, your methodology.** YAML-configurable agents adapt to how *you* scope, not a template.
→ **Memory across engagements.** Scoper learns your patterns — which scope items always blow out, which clients skew risky — and gets sharper every SOW.
→ **Single command: `python run.py`.** No Docker orchestration, no Kubernetes, no cloud setup.

Open source. MIT licensed. Runs on a laptop.

GitHub: https://github.com/parallelromb/scoper

#AI #AgencyLife #Consulting #RFP #ProjectEstimation #AgenticAI #OpenSource

---

## X/Twitter Post

---

I open-sourced Scoper — turns a client RFP into a priced Statement of Work in under 2 minutes.

Built for agencies and consultancies. 9 AI agents. Visual pipeline. Runs fully local with Ollama, so client IP never leaves your laptop.

RFP in → priced SOW out.

`python run.py`

https://github.com/parallelromb/scoper

---

## X/Twitter Thread (alternative)

---

**Tweet 1:**
Scoping an RFP is the slowest part of running an agency.

I open-sourced Scoper — it turns a client RFP into a priced Statement of Work in under 2 minutes, on your own machine, with your own rate card.

Here's how it works 🧵

**Tweet 2:**
Scoper has 9 specialist AI agents — each with a "soul" (YAML-defined role, expertise, tools):

• ARIA — extracts scope from the RFP
• NOVA — effort & cost vs. your rate card
• CHRONOS — schedule
• SENTINEL — compliance & risk
• ATLAS — architecture
...and 4 more

**Tweet 3:**
The pipeline is visual.

Drag agents onto a canvas, connect them, plug in your rate card, hit Run.

28 node types. 5 prebuilt templates for common engagement types — fixed-price, T&M, staff-aug, migration, product build.

Think n8n, but for RFP → SOW.

**Tweet 4:**
The critical design decision: Scoper runs 100% local.

Every RFP you receive is under NDA. SaaS tools for estimation are a non-starter for most serious agencies.

Ollama + Gemma 3 = no API keys, no cloud, no data leakage. Client IP stays on your laptop.

**Tweet 5:**
The memory system is what makes it compounding.

5 layers with Ebbinghaus decay — Scoper learns the scope items that always blow out, the risk patterns across your client types, the delivery quirks of your industry — while forgetting noise.

Every SOW sharpens the next.

**Tweet 6:**
Stack:
• React + Vite + Tailwind (frontend)
• FastAPI + SQLite (backend)
• React Flow (pipeline canvas)
• Pure TypeScript NLP
• 9 YAML agent souls + 13 skill packs

MIT licensed. `python run.py` and it's running.

https://github.com/parallelromb/scoper

---

## Hacker News — Show HN

---

**Title:** Show HN: Scoper – Open-source agency RFP-to-SOW estimator (runs locally)

**Body:**

Hi HN,

I built Scoper to solve a problem I kept watching at consultancies and agencies: scoping an inbound RFP takes 2–5 days of senior people reading requirements, applying rate cards, cross-referencing past engagements, and writing the Statement of Work. Every pitch, same grind.

Scoper runs 9 specialist AI agents in a visual drag-and-drop pipeline. Upload the RFP, pick a template (or build your own pipeline), and get a priced SOW — phases, effort hours, rate-carded costs, resource plan, schedule, risks.

What's interesting technically:

- **Visual pipeline builder** using React Flow with 28 node types. Agents, tools, and processing nodes connect like a flowchart. Every decision is inspectable, so when a client asks "where did this 240 hours come from?" you can show them.

- **Agent "souls"** defined in YAML — each agent has a distinct role, expertise domain, tools, and memory access. ARIA extracts scope items, NOVA estimates against your rate card, CHRONOS schedules, SENTINEL flags compliance risks, etc. Because souls are YAML, agencies can customize agents to match their delivery methodology without touching code.

- **5-layer memory system** with Ebbinghaus decay. Agents retain useful patterns from past SOWs — which scope items always blow out, which client types skew risky — and naturally forget noise. Working memory (session), short-term (hours), episodic (days), long-term (weeks), semantic (months).

- **Runs fully local** with Ollama + Gemma 3. No API keys, no cloud, no data leaving your laptop. For agencies receiving RFPs under NDA, this is table stakes — a SaaS estimation tool is a non-starter.

- **Pure TypeScript NLP engine** — TF-IDF, cosine similarity, domain detection, topic classification. Zero ML library dependencies.

- **Single command deployment** — `python run.py` serves the React SPA + FastAPI backend on one port.

Stack: React + Vite + Tailwind + React Flow (frontend), FastAPI + SQLite (backend), Zustand (state), Recharts (viz).

I'm posting this hoping to hear from people who run agencies or estimation-heavy consulting practices: is the RFP-to-SOW pain real for you? What does your current process look like? If Scoper doesn't solve it, what would?

GitHub: https://github.com/parallelromb/scoper

Happy to go deep on the agent architecture or the pipeline execution model.
