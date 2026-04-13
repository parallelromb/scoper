"""Estimates CRUD + versions + audit routes."""

import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from server.database import get_db

router = APIRouter(prefix="/api/v2", tags=["estimates"])


class EstimateCreate(BaseModel):
    name: str
    status: Optional[str] = "draft"
    total_effort_hours: Optional[float] = None
    total_cost: Optional[float] = None
    confidence_score: Optional[float] = None
    phases: Optional[list] = None
    costs: Optional[list] = None
    resources: Optional[list] = None
    risks: Optional[list] = None
    assumptions: Optional[list] = None
    source_document: Optional[str] = None


class EstimateUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    total_effort_hours: Optional[float] = None
    total_cost: Optional[float] = None
    confidence_score: Optional[float] = None
    phases: Optional[list] = None
    costs: Optional[list] = None
    resources: Optional[list] = None
    risks: Optional[list] = None
    assumptions: Optional[list] = None


class AuditCreate(BaseModel):
    entity_type: str
    entity_id: int
    action: str
    details: Optional[dict] = None
    user_id: Optional[int] = None


def _serialize(val) -> Optional[str]:
    if val is None:
        return None
    return json.dumps(val)


def _row_to_dict(row) -> dict:
    d = dict(row)
    for key in ("phases", "costs", "resources", "risks", "assumptions"):
        if key in d and d[key]:
            try:
                d[key] = json.loads(d[key])
            except (json.JSONDecodeError, TypeError):
                pass
    return d


# ── Estimates CRUD ──


@router.post("/estimates")
async def create_estimate(body: EstimateCreate):
    async with get_db() as db:
        cursor = await db.execute(
            """INSERT INTO estimates
            (name, status, total_effort_hours, total_cost, confidence_score,
             phases, costs, resources, risks, assumptions, source_document)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                body.name,
                body.status,
                body.total_effort_hours,
                body.total_cost,
                body.confidence_score,
                _serialize(body.phases),
                _serialize(body.costs),
                _serialize(body.resources),
                _serialize(body.risks),
                _serialize(body.assumptions),
                body.source_document,
            ),
        )
        await db.commit()
        est_id = cursor.lastrowid

        # Create initial version
        row = await db.execute_fetchall(
            "SELECT * FROM estimates WHERE id = ?", (est_id,)
        )
        if row:
            est = _row_to_dict(row[0])
            await db.execute(
                """INSERT INTO estimate_versions (estimate_id, version, data, change_summary)
                VALUES (?, 1, ?, 'Initial creation')""",
                (est_id, json.dumps(est)),
            )
            await db.commit()

        return {"id": est_id, "message": "Estimate created"}


@router.get("/estimates")
async def list_estimates():
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT * FROM estimates ORDER BY updated_at DESC"
        )
        return [_row_to_dict(r) for r in rows]


@router.get("/estimates/{estimate_id}")
async def get_estimate(estimate_id: int):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT * FROM estimates WHERE id = ?", (estimate_id,)
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Estimate not found")
        return _row_to_dict(rows[0])


@router.put("/estimates/{estimate_id}")
async def update_estimate(estimate_id: int, body: EstimateUpdate):
    async with get_db() as db:
        # Check exists
        rows = await db.execute_fetchall(
            "SELECT * FROM estimates WHERE id = ?", (estimate_id,)
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Estimate not found")

        updates = {}
        for field in (
            "name", "status", "total_effort_hours", "total_cost",
            "confidence_score", "phases", "costs", "resources", "risks", "assumptions",
        ):
            val = getattr(body, field, None)
            if val is not None:
                if field in ("phases", "costs", "resources", "risks", "assumptions"):
                    updates[field] = _serialize(val)
                else:
                    updates[field] = val

        if updates:
            updates["updated_at"] = datetime.utcnow().isoformat()
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [estimate_id]
            await db.execute(
                f"UPDATE estimates SET {set_clause} WHERE id = ?", values
            )

            # Create version snapshot
            version_rows = await db.execute_fetchall(
                "SELECT MAX(version) as max_v FROM estimate_versions WHERE estimate_id = ?",
                (estimate_id,),
            )
            next_version = (version_rows[0]["max_v"] or 0) + 1 if version_rows else 1

            updated = await db.execute_fetchall(
                "SELECT * FROM estimates WHERE id = ?", (estimate_id,)
            )
            est_data = _row_to_dict(updated[0]) if updated else {}

            changed_fields = list(updates.keys())
            changed_fields = [f for f in changed_fields if f != "updated_at"]
            summary = f"Updated: {', '.join(changed_fields)}"

            await db.execute(
                """INSERT INTO estimate_versions (estimate_id, version, data, change_summary)
                VALUES (?, ?, ?, ?)""",
                (estimate_id, next_version, json.dumps(est_data), summary),
            )
            await db.commit()

        return {"message": "Estimate updated", "id": estimate_id}


@router.delete("/estimates/{estimate_id}")
async def delete_estimate(estimate_id: int):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id FROM estimates WHERE id = ?", (estimate_id,)
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Estimate not found")

        await db.execute("DELETE FROM estimate_versions WHERE estimate_id = ?", (estimate_id,))
        await db.execute("DELETE FROM estimates WHERE id = ?", (estimate_id,))
        await db.commit()
        return {"message": "Estimate deleted"}


# ── Versions ──


@router.get("/estimates/{estimate_id}/versions")
async def list_versions(estimate_id: int):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT * FROM estimate_versions WHERE estimate_id = ? ORDER BY version DESC",
            (estimate_id,),
        )
        result = []
        for r in rows:
            d = dict(r)
            if d.get("data"):
                try:
                    d["data"] = json.loads(d["data"])
                except (json.JSONDecodeError, TypeError):
                    pass
            result.append(d)
        return result


# ── Audit ──


@router.post("/audit")
async def create_audit(body: AuditCreate):
    async with get_db() as db:
        cursor = await db.execute(
            """INSERT INTO audit_log (entity_type, entity_id, action, details, user_id)
            VALUES (?, ?, ?, ?, ?)""",
            (
                body.entity_type,
                body.entity_id,
                body.action,
                json.dumps(body.details) if body.details else None,
                body.user_id,
            ),
        )
        await db.commit()
        return {"id": cursor.lastrowid, "message": "Audit entry created"}


@router.get("/audit")
async def query_audit(entity_type: Optional[str] = None, entity_id: Optional[int] = None):
    async with get_db() as db:
        query = "SELECT * FROM audit_log WHERE 1=1"
        params: list = []
        if entity_type:
            query += " AND entity_type = ?"
            params.append(entity_type)
        if entity_id:
            query += " AND entity_id = ?"
            params.append(entity_id)
        query += " ORDER BY created_at DESC"
        rows = await db.execute_fetchall(query, params)
        result = []
        for r in rows:
            d = dict(r)
            if d.get("details"):
                try:
                    d["details"] = json.loads(d["details"])
                except (json.JSONDecodeError, TypeError):
                    pass
            result.append(d)
        return result
