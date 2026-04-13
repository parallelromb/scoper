"""Agent and pipeline execution routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any

router = APIRouter(prefix="/api/v2", tags=["agents"])


class AgentExecuteRequest(BaseModel):
    agent_id: str
    context: str
    config: Optional[dict[str, Any]] = None


class PipelineExecuteRequest(BaseModel):
    graph: dict
    config: Optional[dict[str, Any]] = None


@router.get("/agents")
async def list_agents():
    """List all available agents (reads soul YAMLs)."""
    from backend.orchestrator.executor import list_souls
    return {"agents": list_souls()}


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get details of a specific agent."""
    from backend.orchestrator.executor import load_soul
    try:
        soul = load_soul(agent_id)
        return {"agent": soul}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")


@router.post("/agents/execute")
async def execute_agent_route(req: AgentExecuteRequest):
    """Execute a single agent with the given context."""
    from backend.orchestrator.executor import execute_agent
    try:
        result = await execute_agent(
            agent_id=req.agent_id,
            context=req.context,
            config=req.config,
        )
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Agent not found: {req.agent_id}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")


@router.post("/pipeline/execute")
async def execute_pipeline_route(req: PipelineExecuteRequest):
    """Execute a full pipeline graph server-side."""
    from backend.orchestrator.pipeline import execute_pipeline
    try:
        result = await execute_pipeline(
            graph=req.graph,
            config=req.config,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")
