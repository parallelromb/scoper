"""Public estimate endpoint — lead capture + heuristic estimation."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/public", tags=["public"])

LEADS_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "leads.json"

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class EstimateRequest(BaseModel):
    project_description: str
    project_type: str
    team_size: str
    timeline: str
    email: str
    name: Optional[str] = None


class EstimateResponse(BaseModel):
    id: str
    effort_weeks_low: int
    effort_weeks_high: int
    cost_low: int
    cost_high: int
    suggested_roles: list[str]
    risks: list[str]
    tech_stack: list[str]
    timeline_estimate: str
    complexity_score: int  # 1-100


# ---------------------------------------------------------------------------
# Heuristic engine
# ---------------------------------------------------------------------------

PROJECT_PROFILES = {
    "Web App": {
        "base_weeks": (4, 8),
        "rate": 150,
        "roles": ["Frontend Engineer", "Backend Engineer", "UI/UX Designer", "QA Engineer"],
        "stack": ["React", "Node.js / Python", "PostgreSQL", "AWS / Vercel"],
        "risks": [
            "Scope creep on UI requirements",
            "Third-party API integration delays",
            "Cross-browser compatibility issues",
            "Performance optimization for scale",
        ],
    },
    "Mobile App": {
        "base_weeks": (6, 12),
        "rate": 165,
        "roles": ["Mobile Engineer (iOS)", "Mobile Engineer (Android)", "Backend Engineer", "UI/UX Designer", "QA Engineer"],
        "stack": ["React Native / Swift / Kotlin", "Firebase / Supabase", "REST / GraphQL API", "App Store / Play Store CI/CD"],
        "risks": [
            "Platform-specific bugs and edge cases",
            "App store review rejection cycles",
            "Device fragmentation testing overhead",
            "Push notification reliability across carriers",
        ],
    },
    "SaaS Platform": {
        "base_weeks": (10, 20),
        "rate": 170,
        "roles": ["Full-Stack Engineer", "Backend Engineer", "DevOps Engineer", "UI/UX Designer", "Product Manager", "QA Engineer"],
        "stack": ["React / Next.js", "Python / Go microservices", "PostgreSQL + Redis", "Stripe billing", "AWS / GCP"],
        "risks": [
            "Multi-tenancy architecture complexity",
            "Billing and subscription edge cases",
            "Data isolation and compliance (SOC2, GDPR)",
            "Onboarding flow conversion optimization",
        ],
    },
    "API/Backend": {
        "base_weeks": (3, 6),
        "rate": 155,
        "roles": ["Backend Engineer", "DevOps Engineer", "Technical Writer", "QA Engineer"],
        "stack": ["Python FastAPI / Go / Node.js", "PostgreSQL / MongoDB", "Redis caching", "Docker + Kubernetes"],
        "risks": [
            "API versioning and backward compatibility",
            "Rate limiting and abuse prevention",
            "Documentation drift from implementation",
            "Latency under load spikes",
        ],
    },
    "AI/ML System": {
        "base_weeks": (8, 18),
        "rate": 195,
        "roles": ["ML Engineer", "Data Engineer", "Backend Engineer", "MLOps Engineer", "Domain Expert"],
        "stack": ["Python", "PyTorch / TensorFlow", "Vector DB (Pinecone / pgvector)", "FastAPI serving layer", "GPU infrastructure"],
        "risks": [
            "Model accuracy below production threshold",
            "Training data quality and bias",
            "Inference latency exceeding SLA",
            "GPU cost overruns during training",
        ],
    },
    "E-commerce": {
        "base_weeks": (6, 14),
        "rate": 155,
        "roles": ["Full-Stack Engineer", "Backend Engineer", "UI/UX Designer", "QA Engineer", "Payment Integration Specialist"],
        "stack": ["Next.js / Shopify Hydrogen", "Stripe / PayPal", "PostgreSQL", "CDN + Edge caching", "Analytics pipeline"],
        "risks": [
            "Payment processing edge cases and chargebacks",
            "Inventory sync across channels",
            "SEO and page speed optimization",
            "PCI compliance requirements",
        ],
    },
    "Other": {
        "base_weeks": (4, 10),
        "rate": 155,
        "roles": ["Full-Stack Engineer", "Backend Engineer", "UI/UX Designer", "QA Engineer"],
        "stack": ["React / Next.js", "Python / Node.js", "PostgreSQL", "Docker", "Cloud hosting"],
        "risks": [
            "Unclear requirements leading to rework",
            "Integration complexity with existing systems",
            "Performance bottlenecks at scale",
            "Security vulnerabilities in custom logic",
        ],
    },
}

TEAM_MULTIPLIERS = {
    "Solo dev": 1.8,
    "Small team (2-5)": 1.0,
    "Medium (5-15)": 0.75,
    "Large (15+)": 0.6,
}

TIMELINE_MULTIPLIERS = {
    "ASAP": 1.4,
    "1-3 months": 1.1,
    "3-6 months": 1.0,
    "6-12 months": 0.9,
    "Flexible": 0.85,
}

TIMELINE_LABELS = {
    "ASAP": "Aggressive — expect higher cost due to parallel workstreams",
    "1-3 months": "Tight but achievable with a focused team",
    "3-6 months": "Comfortable pace with room for iteration",
    "6-12 months": "Relaxed — allows for thorough testing and polish",
    "Flexible": "Optimized for quality over speed",
}


def _complexity_from_description(desc: str) -> int:
    """Rough complexity score from description length and keywords."""
    score = 30  # base
    words = desc.lower().split()
    word_count = len(words)

    # Length heuristic
    if word_count > 100:
        score += 25
    elif word_count > 50:
        score += 15
    elif word_count > 25:
        score += 8

    # Keyword boosters
    complex_keywords = [
        "real-time", "realtime", "ai", "ml", "machine learning", "blockchain",
        "distributed", "microservices", "multi-tenant", "compliance", "hipaa",
        "gdpr", "soc2", "encryption", "streaming", "video", "payments",
        "integration", "api", "migrate", "migration", "legacy", "scale",
        "millions", "concurrent", "enterprise", "saas", "marketplace",
    ]
    for kw in complex_keywords:
        if kw in " ".join(words):
            score += 4

    return min(score, 95)


def generate_estimate(req: EstimateRequest) -> EstimateResponse:
    profile = PROJECT_PROFILES.get(req.project_type, PROJECT_PROFILES["Other"])
    base_low, base_high = profile["base_weeks"]

    team_mult = TEAM_MULTIPLIERS.get(req.team_size, 1.0)
    time_mult = TIMELINE_MULTIPLIERS.get(req.timeline, 1.0)
    complexity = _complexity_from_description(req.project_description)
    complexity_mult = 0.7 + (complexity / 100) * 0.8  # 0.7 – 1.5

    effort_low = max(2, round(base_low * team_mult * time_mult * complexity_mult))
    effort_high = max(effort_low + 2, round(base_high * team_mult * time_mult * complexity_mult))

    rate = profile["rate"]
    hours_per_week = 40
    cost_low = effort_low * hours_per_week * rate
    cost_high = effort_high * hours_per_week * rate

    # Pick 3 risks
    risks = profile["risks"][:3]

    # Roles — trim for small teams
    roles = profile["roles"]
    if req.team_size == "Solo dev":
        roles = roles[:2]
    elif req.team_size == "Small team (2-5)":
        roles = roles[:4]

    return EstimateResponse(
        id=str(uuid.uuid4())[:8],
        effort_weeks_low=effort_low,
        effort_weeks_high=effort_high,
        cost_low=round(cost_low, -2),
        cost_high=round(cost_high, -2),
        suggested_roles=roles,
        risks=risks,
        tech_stack=profile["stack"],
        timeline_estimate=TIMELINE_LABELS.get(req.timeline, "Standard delivery"),
        complexity_score=complexity,
    )


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

def _save_lead(req: EstimateRequest, estimate: EstimateResponse):
    LEADS_FILE.parent.mkdir(parents=True, exist_ok=True)

    leads = []
    if LEADS_FILE.exists():
        try:
            leads = json.loads(LEADS_FILE.read_text())
        except (json.JSONDecodeError, Exception):
            leads = []

    leads.append({
        "id": estimate.id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": req.email,
        "name": req.name,
        "project_type": req.project_type,
        "team_size": req.team_size,
        "timeline": req.timeline,
        "description": req.project_description,
        "estimate_effort": f"{estimate.effort_weeks_low}-{estimate.effort_weeks_high} weeks",
        "estimate_cost": f"${estimate.cost_low:,}-${estimate.cost_high:,}",
        "complexity_score": estimate.complexity_score,
    })

    LEADS_FILE.write_text(json.dumps(leads, indent=2))


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/estimate", response_model=EstimateResponse)
async def public_estimate(req: EstimateRequest):
    estimate = generate_estimate(req)
    _save_lead(req, estimate)
    return estimate
