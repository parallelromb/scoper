/**
 * NLP Engine — pure TypeScript, zero ML dependencies.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'get', 'got', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'let', 'like', 'make', 'me', 'might', 'more', 'most', 'must', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'said', 'same', 'shall', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'also', 'been', 'being', 'do', 'done',
  'go', 'going', 'gone', 'got', 'gets', 'know', 'known', 'may', 'need', 'new',
  'old', 'see', 'way', 'well', 'back', 'even', 'still', 'us', 'use', 'used',
])

/** Light stemming — removes common suffixes. */
function stem(word: string): string {
  if (word.length < 4) return word
  if (word.endsWith('ation')) return word.slice(0, -5)
  if (word.endsWith('tion')) return word.slice(0, -4)
  if (word.endsWith('ment')) return word.slice(0, -4)
  if (word.endsWith('ness')) return word.slice(0, -4)
  if (word.endsWith('ious')) return word.slice(0, -4)
  if (word.endsWith('eous')) return word.slice(0, -4)
  if (word.endsWith('able')) return word.slice(0, -4)
  if (word.endsWith('ible')) return word.slice(0, -4)
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3)
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('er') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1)
  return word
}

/** Tokenize text: split, lowercase, remove stop words, light stemming. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .map(stem)
}

/** Compute TF-IDF vectors for a collection of documents. */
export function tfidf(docs: string[][]): Map<string, number>[] {
  const N = docs.length
  // Document frequency
  const df = new Map<string, number>()
  for (const doc of docs) {
    const seen = new Set<string>()
    for (const token of doc) {
      if (!seen.has(token)) {
        df.set(token, (df.get(token) || 0) + 1)
        seen.add(token)
      }
    }
  }

  return docs.map((doc) => {
    const tf = new Map<string, number>()
    for (const token of doc) {
      tf.set(token, (tf.get(token) || 0) + 1)
    }
    const vec = new Map<string, number>()
    const maxTf = Math.max(...tf.values(), 1)
    for (const [token, count] of tf) {
      const tfVal = count / maxTf
      const idf = Math.log(N / (df.get(token) || 1))
      vec.set(token, tfVal * idf)
    }
    // L2 normalize
    let norm = 0
    for (const v of vec.values()) norm += v * v
    norm = Math.sqrt(norm) || 1
    for (const [k, v] of vec) vec.set(k, v / norm)
    return vec
  })
}

/** Cosine similarity between two L2-normalized TF-IDF vectors. */
export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0
  for (const [token, aVal] of a) {
    const bVal = b.get(token)
    if (bVal !== undefined) dot += aVal * bVal
  }
  return dot
}

// ── Domain Detection ──

const DOMAIN_VOCABULARIES: Record<string, Record<string, number>> = {
  payments: {
    payment: 3, transaction: 3, merchant: 2, settlement: 2, gateway: 2,
    pos: 2, card: 2, wallet: 2, checkout: 2, stripe: 1, pci: 2,
    authorization: 2, refund: 2, chargeback: 2, acquiring: 2,
  },
  lending: {
    loan: 3, credit: 3, mortgage: 2, underwriting: 3, origination: 2,
    borrower: 2, interest: 2, amortization: 2, default: 1, collateral: 2,
    disbursement: 2, repayment: 2, scoring: 2,
  },
  wealth: {
    portfolio: 3, investment: 3, wealth: 3, advisory: 2, asset: 2,
    fund: 2, equity: 2, trading: 2, brokerage: 2, custody: 2,
    rebalancing: 2, dividend: 2,
  },
  insurance: {
    policy: 3, claim: 3, premium: 3, underwriting: 2, actuarial: 3,
    coverage: 2, deductible: 2, insurer: 2, risk: 1, beneficiary: 2,
    adjuster: 2, renewal: 2,
  },
  infrastructure: {
    server: 2, cloud: 2, kubernetes: 3, docker: 2, aws: 2, azure: 2,
    gcp: 2, infrastructure: 3, devops: 2, cicd: 2, pipeline: 1,
    terraform: 3, ansible: 2, monitoring: 2, scalability: 2,
  },
  data: {
    database: 2, data: 2, warehouse: 3, etl: 3, analytics: 2,
    migration: 2, schema: 2, sql: 2, nosql: 2, lakehouse: 3,
    hadoop: 2, spark: 2, streaming: 2, kafka: 2,
  },
  security: {
    security: 3, authentication: 3, authorization: 2, encryption: 3,
    firewall: 2, vulnerability: 2, compliance: 2, soc: 3, pentest: 3,
    oauth: 2, mfa: 2, zero_trust: 3, siem: 3,
  },
  mobile: {
    mobile: 3, ios: 3, android: 3, react_native: 3, flutter: 3,
    app: 1, push_notification: 2, responsive: 1, native: 2, swift: 2,
    kotlin: 2,
  },
  web: {
    web: 2, frontend: 2, backend: 2, react: 2, angular: 2, vue: 2,
    html: 1, css: 1, javascript: 2, typescript: 2, spa: 2,
    responsive: 2, api: 1, rest: 2, graphql: 2,
  },
  cloud: {
    cloud: 3, saas: 3, paas: 2, iaas: 2, microservice: 3, serverless: 3,
    lambda: 2, containerization: 2, multi_tenant: 3, elasticity: 2,
    auto_scaling: 2,
  },
}

export interface DomainScore {
  domain: string
  score: number
  confidence: number
}

/** Detect domains from text using weighted keyword vocabularies. */
export function detectDomain(text: string): DomainScore[] {
  const tokens = tokenize(text)
  const tokenSet = new Map<string, number>()
  for (const t of tokens) tokenSet.set(t, (tokenSet.get(t) || 0) + 1)

  const scores: DomainScore[] = []
  for (const [domain, vocab] of Object.entries(DOMAIN_VOCABULARIES)) {
    let score = 0
    let maxPossible = 0
    for (const [keyword, weight] of Object.entries(vocab)) {
      maxPossible += weight
      const stemmed = stem(keyword.toLowerCase())
      const count = tokenSet.get(stemmed) || 0
      if (count > 0) score += weight * Math.min(count, 3)
    }
    if (score > 0) {
      scores.push({
        domain,
        score,
        confidence: Math.min(score / (maxPossible * 0.3), 1),
      })
    }
  }
  return scores.sort((a, b) => b.score - a.score)
}

// ── Topic Classification ──

const TOPIC_KEYWORDS: Record<string, string[]> = {
  infrastructure: [
    'server', 'cloud', 'deploy', 'host', 'container', 'kubernetes',
    'docker', 'aws', 'azure', 'gcp', 'scaling', 'load_balancer',
    'network', 'firewall', 'monitoring', 'uptime',
  ],
  data_migration: [
    'migration', 'migrate', 'data', 'transfer', 'etl', 'import', 'export',
    'legacy', 'conversion', 'mapping', 'transformation', 'schema',
  ],
  api_integration: [
    'api', 'integration', 'rest', 'graphql', 'webhook', 'endpoint',
    'microservice', 'gateway', 'oauth', 'sdk', 'third_party', 'connector',
  ],
  ui_development: [
    'ui', 'ux', 'frontend', 'interface', 'design', 'component', 'layout',
    'responsive', 'accessibility', 'theme', 'dashboard', 'form', 'page',
  ],
  security: [
    'security', 'auth', 'encryption', 'compliance', 'gdpr', 'pci',
    'vulnerability', 'penetration', 'audit', 'rbac', 'sso', 'mfa',
  ],
  testing: [
    'test', 'qa', 'quality', 'automation', 'regression', 'unit',
    'integration_test', 'e2e', 'coverage', 'bug', 'defect', 'validation',
  ],
  devops: [
    'cicd', 'pipeline', 'jenkins', 'github_actions', 'terraform',
    'ansible', 'monitoring', 'logging', 'alerting', 'sre', 'incident',
  ],
  analytics: [
    'analytics', 'reporting', 'dashboard', 'metric', 'kpi', 'bi',
    'visualization', 'chart', 'insight', 'tracking', 'telemetry',
  ],
}

export interface TopicScore {
  topic: string
  score: number
  matches: string[]
}

/** Classify text into topics using keyword matching. */
export function classifyTopics(text: string): TopicScore[] {
  const tokens = tokenize(text)
  const tokenSet = new Set(tokens)

  const scores: TopicScore[] = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches: string[] = []
    for (const kw of keywords) {
      const stemmed = stem(kw.toLowerCase())
      if (tokenSet.has(stemmed)) {
        matches.push(kw)
      }
    }
    if (matches.length > 0) {
      scores.push({
        topic,
        score: matches.length / keywords.length,
        matches,
      })
    }
  }
  return scores.sort((a, b) => b.score - a.score)
}

/** Simple hash fingerprint of sorted unique tokens. */
export function fingerprint(text: string): string {
  const tokens = [...new Set(tokenize(text))].sort()
  const str = tokens.join('|')
  // Simple FNV-1a 32-bit hash
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export interface DocumentAnalysis {
  domains: DomainScore[]
  topics: TopicScore[]
  wordCount: number
  complexity: 'low' | 'medium' | 'high'
  fingerprint: string
}

/** Run full NLP analysis on a document text. */
export function analyzeDocument(text: string): DocumentAnalysis {
  const tokens = tokenize(text)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const domains = detectDomain(text)
  const topics = classifyTopics(text)
  const fp = fingerprint(text)

  // Complexity based on unique tokens, domains, topics
  const uniqueTokens = new Set(tokens).size
  let complexityScore = 0
  if (uniqueTokens > 200) complexityScore++
  if (uniqueTokens > 500) complexityScore++
  if (domains.length > 3) complexityScore++
  if (topics.length > 4) complexityScore++
  if (wordCount > 2000) complexityScore++

  const complexity: 'low' | 'medium' | 'high' =
    complexityScore >= 3 ? 'high' : complexityScore >= 1 ? 'medium' : 'low'

  return { domains, topics, wordCount, complexity, fingerprint: fp }
}
