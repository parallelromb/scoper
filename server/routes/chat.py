"""Chat proxy route — routes to configured LLM provider via shared client."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from server.services.llm_client import call_llm

import httpx

router = APIRouter(prefix="/api/v2", tags=["chat"])


class ChatRequest(BaseModel):
    system_prompt: str
    user_message: str
    model: Optional[str] = None
    temperature: Optional[float] = 0.7


class ChatResponse(BaseModel):
    content: str
    tokens_used: int
    model: str
    provider: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Proxy chat to configured LLM provider."""
    try:
        result = await call_llm(
            system_prompt=req.system_prompt,
            user_message=req.user_message,
            model=req.model,
            temperature=req.temperature if req.temperature is not None else 0.7,
        )
        return ChatResponse(
            content=result.content,
            tokens_used=result.tokens_used,
            model=result.model,
            provider=result.provider,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"LLM provider error: {e.response.text[:500]}",
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to LLM provider. Check configuration.",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
