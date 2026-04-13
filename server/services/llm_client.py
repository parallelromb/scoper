"""Shared LLM client — reusable across chat, agents, and pipelines."""

import httpx
from dataclasses import dataclass
from typing import Optional


@dataclass
class LLMResponse:
    content: str
    tokens_used: int
    model: str
    provider: str


async def call_llm(
    system_prompt: str,
    user_message: str,
    model: Optional[str] = None,
    temperature: float = 0.7,
    provider: Optional[str] = None,
) -> LLMResponse:
    """Call the configured LLM provider and return a structured response.

    Args:
        system_prompt: System-level instructions for the model.
        user_message: The user/input message.
        model: Override model name (uses config default if None).
        temperature: Sampling temperature (0-1).
        provider: Override provider (uses config default if None).

    Returns:
        LLMResponse with content, token count, model, and provider.
    """
    from server.config import LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, OLLAMA_HOST, OLLAMA_MODEL

    provider = (provider or LLM_PROVIDER).lower()
    model = model or LLM_MODEL

    async with httpx.AsyncClient(timeout=120.0) as client:
        if provider == "ollama":
            model = model or OLLAMA_MODEL
            resp = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "stream": False,
                    "options": {"temperature": temperature},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "")
            tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)
            return LLMResponse(content=content, tokens_used=tokens, model=model, provider="ollama")

        elif provider == "openai":
            model = model or "gpt-4o"
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {LLM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": temperature,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return LLMResponse(content=content, tokens_used=tokens, model=model, provider="openai")

        elif provider == "anthropic":
            model = model or "claude-sonnet-4-20250514"
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": LLM_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 4096,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": temperature,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["content"][0]["text"]
            tokens = data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0)
            return LLMResponse(content=content, tokens_used=tokens, model=model, provider="anthropic")

        elif provider == "github":
            model = model or "gpt-4o"
            resp = await client.post(
                "https://models.inference.ai.azure.com/chat/completions",
                headers={
                    "Authorization": f"Bearer {LLM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": temperature,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return LLMResponse(content=content, tokens_used=tokens, model=model, provider="github")

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
