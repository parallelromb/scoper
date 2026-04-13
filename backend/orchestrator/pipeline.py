"""Pipeline orchestrator — topological execution of agent graphs with parallel branch support."""

import asyncio
import json
import time
from collections import defaultdict, deque
from typing import Any, Optional

from backend.orchestrator.executor import execute_agent


def _topological_sort(nodes: list[dict], edges: list[dict]) -> list[list[str]]:
    """Kahn's algorithm returning execution levels (groups that can run in parallel).

    Args:
        nodes: List of node dicts with at least an "id" key.
        edges: List of edge dicts with "source" and "target" keys.

    Returns:
        List of levels, where each level is a list of node IDs that can execute concurrently.
    """
    node_ids = {n["id"] for n in nodes}
    in_degree = defaultdict(int)
    adjacency = defaultdict(list)

    for node_id in node_ids:
        in_degree[node_id] = 0

    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        adjacency[src].append(tgt)
        in_degree[tgt] += 1

    # Start with nodes that have no incoming edges
    queue = deque([nid for nid in node_ids if in_degree[nid] == 0])
    levels = []

    while queue:
        current_level = list(queue)
        levels.append(current_level)
        next_queue = deque()

        for node_id in current_level:
            for neighbor in adjacency[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    next_queue.append(neighbor)

        queue = next_queue

    # Check for cycles
    processed = sum(len(level) for level in levels)
    if processed != len(node_ids):
        raise ValueError(
            f"Pipeline graph contains a cycle. Processed {processed}/{len(node_ids)} nodes."
        )

    return levels


async def execute_pipeline(
    graph: dict,
    config: Optional[dict[str, Any]] = None,
) -> dict:
    """Execute a pipeline graph with topological ordering and parallel branches.

    Args:
        graph: Pipeline graph with "nodes" and "edges" lists.
            Each node: {id, type, data: {agent_id?, context?, ...}}
            Each edge: {source, target}
        config: Optional LLM/execution config overrides.

    Returns:
        Dict with: results, total_tokens, latency_ms, node_results, levels.
    """
    config = config or {}
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    if not nodes:
        return {
            "results": {},
            "total_tokens": 0,
            "latency_ms": 0,
            "node_results": {},
            "levels": [],
        }

    # Build node lookup
    node_map = {n["id"]: n for n in nodes}

    # Topological sort into execution levels
    levels = _topological_sort(nodes, edges)

    # Build reverse dependency map (which nodes feed into each node)
    parents = defaultdict(list)
    for edge in edges:
        parents[edge["target"]].append(edge["source"])

    start_time = time.time()
    total_tokens = 0
    node_results = {}

    for level in levels:

        async def _execute_node(node_id: str) -> tuple[str, dict]:
            node = node_map[node_id]
            node_type = node.get("type", "agent")
            node_data = node.get("data", {})

            if node_type == "agent":
                agent_id = node_data.get("agent_id", node_id)

                # Build context: combine node's own context with parent outputs
                context_parts = []
                if node_data.get("context"):
                    context_parts.append(node_data["context"])

                for parent_id in parents.get(node_id, []):
                    if parent_id in node_results:
                        parent_result = node_results[parent_id]
                        result_data = parent_result.get("result", {})
                        context_parts.append(
                            f"## Output from {parent_id}:\n{json.dumps(result_data, indent=2)}"
                        )

                context = "\n\n".join(context_parts) if context_parts else ""

                result = await execute_agent(
                    agent_id=agent_id,
                    context=context,
                    config=config,
                )
                return node_id, result

            elif node_type == "input":
                # Input nodes just pass through their data
                return node_id, {
                    "agent_id": "input",
                    "agent_name": "Input",
                    "result": node_data,
                    "tokens_used": 0,
                    "model": "none",
                    "provider": "none",
                }

            elif node_type == "output":
                # Output nodes aggregate parent results
                aggregated = {}
                for parent_id in parents.get(node_id, []):
                    if parent_id in node_results:
                        aggregated[parent_id] = node_results[parent_id].get("result", {})
                return node_id, {
                    "agent_id": "output",
                    "agent_name": "Output",
                    "result": aggregated,
                    "tokens_used": 0,
                    "model": "none",
                    "provider": "none",
                }

            else:
                return node_id, {
                    "agent_id": node_type,
                    "agent_name": node_type,
                    "result": {"_skipped": True, "reason": f"Unknown node type: {node_type}"},
                    "tokens_used": 0,
                    "model": "none",
                    "provider": "none",
                }

        # Execute all nodes in this level concurrently
        tasks = [_execute_node(node_id) for node_id in level]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                # Store error but continue pipeline
                node_results[str(result)] = {
                    "agent_id": "error",
                    "agent_name": "Error",
                    "result": {"error": str(result)},
                    "tokens_used": 0,
                    "model": "none",
                    "provider": "none",
                }
            else:
                node_id, node_result = result
                node_results[node_id] = node_result
                total_tokens += node_result.get("tokens_used", 0)

    latency_ms = int((time.time() - start_time) * 1000)

    return {
        "results": node_results,
        "total_tokens": total_tokens,
        "latency_ms": latency_ms,
        "node_results": node_results,
        "levels": [[nid for nid in level] for level in levels],
    }
