"""Memory service — Ebbinghaus-decay-aware memory storage and retrieval."""

import json
from datetime import datetime, timezone
from typing import Optional

from server.database import get_db

# Half-life in days per memory layer
HALF_LIFE_DAYS = {
    "working": 0,       # No decay — always fresh
    "short_term": 0.25,  # 6 hours
    "long_term": 14,     # 2 weeks
    "semantic": 60,      # 2 months
    "episodic": 3,       # 3 days
}

DECAY_THRESHOLD = 0.1


def _apply_decay(importance: float, layer: str, created_at: str) -> float:
    """Apply Ebbinghaus forgetting curve: I(t) = I0 * 0.5^(t / half_life)."""
    half_life = HALF_LIFE_DAYS.get(layer, 1.0)
    if half_life == 0:
        return importance  # Working memory does not decay

    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        created = datetime.fromisoformat(created_at)

    now = datetime.now(timezone.utc)
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)

    elapsed_days = (now - created).total_seconds() / 86400.0
    return importance * (0.5 ** (elapsed_days / half_life))


async def store_memory(
    agent_id: str,
    layer: str,
    content: str,
    importance: float = 0.5,
    quality: float = 0.5,
    outcome: float = 0.5,
) -> int:
    """Insert a memory record. Returns the new memory ID."""
    async with get_db() as db:
        cursor = await db.execute(
            """INSERT INTO memories (agent_id, layer, content, importance, quality, outcome, last_accessed)
               VALUES (?, ?, ?, ?, ?, ?, datetime('now'))""",
            (agent_id, layer, content, importance, quality, outcome),
        )
        await db.commit()
        return cursor.lastrowid


async def retrieve_memories(
    agent_id: str,
    layer: Optional[str] = None,
    limit: int = 10,
) -> list[dict]:
    """Retrieve memories with Ebbinghaus decay applied. Filters below threshold."""
    async with get_db() as db:
        if layer:
            cursor = await db.execute(
                """SELECT id, agent_id, layer, content, importance, quality, outcome,
                          created_at, last_accessed, decay_rate
                   FROM memories WHERE agent_id = ? AND layer = ?
                   ORDER BY created_at DESC LIMIT ?""",
                (agent_id, layer, limit * 3),  # Fetch extra to compensate for decay filtering
            )
        else:
            cursor = await db.execute(
                """SELECT id, agent_id, layer, content, importance, quality, outcome,
                          created_at, last_accessed, decay_rate
                   FROM memories WHERE agent_id = ?
                   ORDER BY created_at DESC LIMIT ?""",
                (agent_id, limit * 3),
            )

        rows = await cursor.fetchall()

    results = []
    for row in rows:
        r = dict(row)
        effective_importance = _apply_decay(r["importance"], r["layer"], r["created_at"])
        if effective_importance < DECAY_THRESHOLD:
            continue
        r["effective_importance"] = round(effective_importance, 4)
        results.append(r)

    # Sort by effective importance descending, then take limit
    results.sort(key=lambda x: x["effective_importance"], reverse=True)
    return results[:limit]


async def prune_memories() -> int:
    """Delete memories that have decayed below threshold. Returns count deleted."""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, importance, layer, created_at FROM memories"
        )
        rows = await cursor.fetchall()

    to_delete = []
    for row in rows:
        r = dict(row)
        effective = _apply_decay(r["importance"], r["layer"], r["created_at"])
        if effective < DECAY_THRESHOLD:
            to_delete.append(r["id"])

    if to_delete:
        async with get_db() as db:
            placeholders = ",".join("?" for _ in to_delete)
            await db.execute(f"DELETE FROM memories WHERE id IN ({placeholders})", to_delete)
            await db.commit()

    return len(to_delete)
