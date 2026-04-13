"""Memory CRUD routes with Ebbinghaus decay."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from server.database import get_db
from server.services.memory import retrieve_memories, store_memory, prune_memories

router = APIRouter(prefix="/api/v2", tags=["memories"])


class MemoryCreateRequest(BaseModel):
    agent_id: str
    layer: str
    content: str
    importance: Optional[float] = 0.5
    quality: Optional[float] = 0.5
    outcome: Optional[float] = 0.5


@router.get("/memories")
async def get_memories(
    agent_id: str,
    layer: Optional[str] = None,
    limit: int = 10,
):
    """Retrieve memories with Ebbinghaus decay applied."""
    memories = await retrieve_memories(agent_id=agent_id, layer=layer, limit=limit)
    return {"memories": memories, "count": len(memories)}


@router.post("/memories")
async def create_memory(req: MemoryCreateRequest):
    """Store a new memory."""
    valid_layers = {"working", "short_term", "long_term", "semantic", "episodic"}
    if req.layer not in valid_layers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid layer: {req.layer}. Must be one of: {', '.join(sorted(valid_layers))}",
        )
    memory_id = await store_memory(
        agent_id=req.agent_id,
        layer=req.layer,
        content=req.content,
        importance=req.importance,
        quality=req.quality,
        outcome=req.outcome,
    )
    return {"id": memory_id, "status": "created"}


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: int):
    """Delete a specific memory."""
    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM memories WHERE id = ?", (memory_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Memory not found: {memory_id}")
        await db.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        await db.commit()
    return {"id": memory_id, "status": "deleted"}


@router.post("/memories/prune")
async def prune_memories_route():
    """Delete all memories that have decayed below threshold."""
    count = await prune_memories()
    return {"pruned": count, "status": "complete"}
