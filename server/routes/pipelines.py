"""Pipeline and run management routes."""

import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from server.database import get_db

router = APIRouter(prefix="/api/v2", tags=["pipelines"])


# ── Models ──

class PipelineCreate(BaseModel):
    name: str
    graph: str  # JSON string


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    graph: Optional[str] = None


class RunCreate(BaseModel):
    pipeline_id: int
    status: str = "running"


class RunUpdate(BaseModel):
    status: Optional[str] = None
    total_tokens: Optional[int] = None
    latency_ms: Optional[int] = None
    node_results: Optional[str] = None
    error: Optional[str] = None


# ── Pipeline Routes ──

@router.post("/pipelines")
async def create_pipeline(payload: PipelineCreate):
    async with get_db() as db:
        cursor = await db.execute(
            "INSERT INTO pipeline_graphs (name, graph, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (payload.name, payload.graph, datetime.utcnow().isoformat(), datetime.utcnow().isoformat()),
        )
        await db.commit()
        return {"id": cursor.lastrowid, "name": payload.name}


@router.get("/pipelines")
async def list_pipelines():
    async with get_db() as db:
        rows = await db.execute(
            "SELECT id, name, created_at, updated_at FROM pipeline_graphs ORDER BY updated_at DESC"
        )
        results = await rows.fetchall()
        return [
            {"id": r["id"], "name": r["name"], "created_at": r["created_at"], "updated_at": r["updated_at"]}
            for r in results
        ]


@router.get("/pipelines/{pipeline_id}")
async def get_pipeline(pipeline_id: int):
    async with get_db() as db:
        row = await db.execute(
            "SELECT id, name, graph, created_at, updated_at FROM pipeline_graphs WHERE id = ?",
            (pipeline_id,),
        )
        result = await row.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Pipeline not found")
        return {
            "id": result["id"],
            "name": result["name"],
            "graph": result["graph"],
            "created_at": result["created_at"],
            "updated_at": result["updated_at"],
        }


@router.put("/pipelines/{pipeline_id}")
async def update_pipeline(pipeline_id: int, payload: PipelineUpdate):
    async with get_db() as db:
        row = await db.execute("SELECT id FROM pipeline_graphs WHERE id = ?", (pipeline_id,))
        if not await row.fetchone():
            raise HTTPException(status_code=404, detail="Pipeline not found")

        updates = []
        values = []
        if payload.name is not None:
            updates.append("name = ?")
            values.append(payload.name)
        if payload.graph is not None:
            updates.append("graph = ?")
            values.append(payload.graph)
        updates.append("updated_at = ?")
        values.append(datetime.utcnow().isoformat())
        values.append(pipeline_id)

        await db.execute(
            f"UPDATE pipeline_graphs SET {', '.join(updates)} WHERE id = ?",
            values,
        )
        await db.commit()
        return {"id": pipeline_id, "updated": True}


@router.delete("/pipelines/{pipeline_id}")
async def delete_pipeline(pipeline_id: int):
    async with get_db() as db:
        row = await db.execute("SELECT id FROM pipeline_graphs WHERE id = ?", (pipeline_id,))
        if not await row.fetchone():
            raise HTTPException(status_code=404, detail="Pipeline not found")
        await db.execute("DELETE FROM pipeline_graphs WHERE id = ?", (pipeline_id,))
        await db.commit()
        return {"id": pipeline_id, "deleted": True}


# ── Run Routes ──

@router.post("/runs")
async def create_run(payload: RunCreate):
    now = datetime.utcnow().isoformat()
    async with get_db() as db:
        cursor = await db.execute(
            "INSERT INTO pipeline_runs (pipeline_id, status, started_at) VALUES (?, ?, ?)",
            (payload.pipeline_id, payload.status, now),
        )
        await db.commit()
        return {"id": cursor.lastrowid, "pipeline_id": payload.pipeline_id, "status": payload.status}


@router.put("/runs/{run_id}")
async def update_run(run_id: int, payload: RunUpdate):
    async with get_db() as db:
        row = await db.execute("SELECT id FROM pipeline_runs WHERE id = ?", (run_id,))
        if not await row.fetchone():
            raise HTTPException(status_code=404, detail="Run not found")

        updates = []
        values = []
        if payload.status is not None:
            updates.append("status = ?")
            values.append(payload.status)
            if payload.status in ("completed", "failed"):
                updates.append("completed_at = ?")
                values.append(datetime.utcnow().isoformat())
        if payload.total_tokens is not None:
            updates.append("total_tokens = ?")
            values.append(payload.total_tokens)
        if payload.latency_ms is not None:
            updates.append("latency_ms = ?")
            values.append(payload.latency_ms)
        if payload.node_results is not None:
            updates.append("node_results = ?")
            values.append(payload.node_results)
        if payload.error is not None:
            updates.append("error = ?")
            values.append(payload.error)

        if updates:
            values.append(run_id)
            await db.execute(
                f"UPDATE pipeline_runs SET {', '.join(updates)} WHERE id = ?",
                values,
            )
            await db.commit()
        return {"id": run_id, "updated": True}


@router.get("/runs")
async def list_runs():
    async with get_db() as db:
        rows = await db.execute(
            "SELECT id, pipeline_id, status, started_at, completed_at, total_tokens, latency_ms FROM pipeline_runs ORDER BY started_at DESC LIMIT 50"
        )
        results = await rows.fetchall()
        return [
            {
                "id": r["id"],
                "pipeline_id": r["pipeline_id"],
                "status": r["status"],
                "started_at": r["started_at"],
                "completed_at": r["completed_at"],
                "total_tokens": r["total_tokens"],
                "latency_ms": r["latency_ms"],
            }
            for r in results
        ]


@router.get("/runs/{run_id}")
async def get_run(run_id: int):
    async with get_db() as db:
        row = await db.execute(
            "SELECT * FROM pipeline_runs WHERE id = ?", (run_id,)
        )
        result = await row.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Run not found")
        return {
            "id": result["id"],
            "pipeline_id": result["pipeline_id"],
            "status": result["status"],
            "started_at": result["started_at"],
            "completed_at": result["completed_at"],
            "total_tokens": result["total_tokens"],
            "latency_ms": result["latency_ms"],
            "node_results": result["node_results"],
            "error": result["error"],
        }
