/**
 * LLM Chat Service — calls POST /api/v2/chat which proxies to the configured LLM provider.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  content: string
  tokens_used: number
  model: string
  provider: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
}

/**
 * Send a chat request to the backend LLM proxy.
 */
export async function llmChat(
  systemPrompt: string,
  userMessage: string,
  options?: ChatOptions,
): Promise<ChatResponse> {
  const res = await fetch('/api/v2/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_prompt: systemPrompt,
      user_message: userMessage,
      model: options?.model,
      temperature: options?.temperature,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Chat request failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Parse JSON from LLM response text with 4 fallback strategies.
 */
export function parseJSONResponse<T = unknown>(text: string): T | null {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(text) as T
  } catch {
    // continue
  }

  // Strategy 2: Extract from markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T
    } catch {
      // continue
    }
  }

  // Strategy 3: Regex extract first {...} or [...]
  const objMatch = text.match(/(\{[\s\S]*\})/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[1]) as T
    } catch {
      // continue
    }
  }
  const arrMatch = text.match(/(\[[\s\S]*\])/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[1]) as T
    } catch {
      // continue
    }
  }

  // Strategy 4: Best-effort key-value extraction
  try {
    const pairs: Record<string, string> = {}
    const kvRegex = /["']?(\w+)["']?\s*[:=]\s*["']?([^"'\n,}]+)["']?/g
    let match: RegExpExecArray | null
    while ((match = kvRegex.exec(text)) !== null) {
      pairs[match[1]] = match[2].trim()
    }
    if (Object.keys(pairs).length > 0) {
      return pairs as T
    }
  } catch {
    // continue
  }

  return null
}
