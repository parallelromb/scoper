"""Agent executor — loads soul YAMLs and executes agents via the shared LLM client."""

import json
import re
from pathlib import Path
from typing import Any, Optional

import yaml

from server.services.llm_client import call_llm
from server.services.memory import store_memory, retrieve_memories

SOULS_DIR = Path(__file__).resolve().parent.parent / "agents" / "souls"
SKILLS_DIR = Path(__file__).resolve().parent.parent / "agents" / "skills"


def load_soul(agent_id: str) -> dict:
    """Load an agent soul definition from YAML."""
    path = SOULS_DIR / f"{agent_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Soul not found: {agent_id}")
    with open(path, "r") as f:
        return yaml.safe_load(f)


def load_skill(skill_id: str) -> dict:
    """Load a skill definition from YAML."""
    path = SKILLS_DIR / f"{skill_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Skill not found: {skill_id}")
    with open(path, "r") as f:
        return yaml.safe_load(f)


def list_souls() -> list[dict]:
    """List all available agent souls."""
    souls = []
    for path in sorted(SOULS_DIR.glob("*.yaml")):
        with open(path, "r") as f:
            soul = yaml.safe_load(f)
            souls.append({
                "id": soul["id"],
                "name": soul["name"],
                "role": soul["role"],
                "description": soul["description"],
                "expertise": soul.get("expertise", []),
                "tools": soul.get("tools", []),
            })
    return souls


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    # Try direct parse first
    text = text.strip()
    if text.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    # Try extracting from markdown code block
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Last resort: find first { to last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Return raw content wrapped in a dict
    return {"raw_response": text, "_parse_error": True}


async def execute_agent(
    agent_id: str,
    context: str,
    config: Optional[dict[str, Any]] = None,
) -> dict:
    """Execute an agent: load soul, build prompt, call LLM, parse response.

    Args:
        agent_id: The soul ID (e.g., "aria", "nova").
        context: The user-provided context/document for the agent to analyze.
        config: Optional overrides — model, temperature, provider, write_memory.

    Returns:
        Dict with: agent_id, result (parsed JSON), tokens_used, model, provider.
    """
    config = config or {}
    soul = load_soul(agent_id)

    # Build system prompt from soul
    system_prompt = soul["system_prompt"]

    # Optionally inject memories
    memory_conf = soul.get("memory_access", {})
    read_layers = memory_conf.get("read", [])
    if read_layers:
        memories = []
        for layer in read_layers:
            layer_memories = await retrieve_memories(agent_id, layer=layer, limit=5)
            memories.extend(layer_memories)
        if memories:
            memory_text = "\n".join(
                f"[{m['layer']}] {m['content']}" for m in memories[:10]
            )
            system_prompt += f"\n\n## Relevant Memories\n{memory_text}"

    # Call LLM
    llm_response = await call_llm(
        system_prompt=system_prompt,
        user_message=context,
        model=config.get("model"),
        temperature=config.get("temperature", 0.3),
        provider=config.get("provider"),
    )

    # Parse JSON from response
    result = _extract_json(llm_response.content)

    # Optionally write to memory
    write_layers = memory_conf.get("write", [])
    if config.get("write_memory", True) and write_layers:
        summary = result.get("summary", llm_response.content[:500])
        for layer in write_layers:
            await store_memory(
                agent_id=agent_id,
                layer=layer,
                content=summary,
                importance=0.6,
                quality=0.5,
                outcome=0.5,
            )

    return {
        "agent_id": agent_id,
        "agent_name": soul["name"],
        "result": result,
        "tokens_used": llm_response.tokens_used,
        "model": llm_response.model,
        "provider": llm_response.provider,
    }
