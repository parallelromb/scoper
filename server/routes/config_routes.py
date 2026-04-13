from fastapi import APIRouter
from server.config import LLM_PROVIDER, OLLAMA_HOST, OLLAMA_MODEL

router = APIRouter(prefix="/api", tags=["config"])


@router.get("/config")
async def get_config():
    return {
        "llm_provider": LLM_PROVIDER,
        "ollama_host": OLLAMA_HOST,
        "ollama_model": OLLAMA_MODEL,
    }
