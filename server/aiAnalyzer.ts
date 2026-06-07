import type { GeneratedReadme } from './analyzeRepo'
import type { GitHubRepo } from './github'
import { normalizeReadme, toMarkdownString } from './normalizeReadme'

export type AIProvider = 'openai' | 'groq'

export interface AIAnalyzerOptions {
  provider: AIProvider
  apiKey: string
  model?: string
}

import type { ParsedExistingReadme } from './parseExistingReadme'

export interface RepoAIContext {
  repo: GitHubRepo
  owner: string
  userDescription?: string
  existingReadme?: string
  parsedExisting?: ParsedExistingReadme
  detectedStack: string[]
  languages: { name: string; percent: number }[]
  fileCount: number
  topPaths: string[]
  fileContents: Map<string, string>
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
  baseline: GeneratedReadme
}

const PROVIDERS: Record<AIProvider, { baseUrl: string; defaultModel: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
  },
}

const SYSTEM_PROMPT =
  'You are a senior developer advocate who writes GitHub README files. You MUST respond with a single valid JSON object only. No markdown fences, no commentary before or after the JSON.'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '\n... [truncated]'
}

function buildPrompt(ctx: RepoAIContext): string {
  const { repo, detectedStack, languages, topPaths, fileContents, baseline, userDescription, existingReadme, parsedExisting } = ctx

  const fileSnippets = [...fileContents.entries()]
    .filter(([path]) => path !== 'README.md')
    .slice(0, 5)
    .map(([path, content]) => `### ${path}\n${truncate(content, 1200)}`)
    .join('\n\n')

  const userContextBlock = userDescription?.trim()
    ? `
## Author's project description (prioritize)
"""
${userDescription.trim()}
"""
`
    : ''

  const existingBlock = parsedExisting?.isSubstantial && existingReadme
    ? `
## EXISTING README (CRITICAL — preserve and enhance, never simplify)
This repository already has a detailed README. Your output MUST be at least as comprehensive.
- Keep ALL tables, metrics, accuracy numbers, route lists, model specs, Firebase details, disclaimers
- Keep ### subsections under Features (use featuresDetail field with full markdown)
- Keep extra sections like Key Routes, AI Models, Firebase, Medical Disclaimer in additionalSections
- Only ADD or REFINE content from the repo scan — do NOT replace with generic boilerplate
- If unsure, keep the existing README content verbatim

"""
${truncate(existingReadme, 14000)}
"""
`
    : ''

  const hasRichFeatures = Boolean(baseline.featuresDetail?.trim())

  return `Analyze this GitHub repository and return a JSON object for a professional README.
${userContextBlock}${existingBlock}
Repository: ${repo.full_name}
GitHub description: ${repo.description ?? 'N/A'}
Stack: ${detectedStack.join(', ') || 'Unknown'}
Languages: ${languages.map((l) => `${l.name} ${l.percent}%`).join(', ')}
Files scanned: ${ctx.fileCount}

Sample paths:
${topPaths.slice(0, 35).join('\n')}

Other key files:
${fileSnippets || 'None'}

Return JSON with these keys:
{
  "tagline": "one compelling sentence",
  "aim": "2-4 sentences",
  "description": "detailed overview with metrics and tables as markdown string",
  "problemStatement": "2-4 sentences",
  "targetAudience": "markdown bullet list",
  "features": ${hasRichFeatures ? '[] (use featuresDetail instead)' : '["detailed feature 1", "feature 2", ...]'},
  "featuresDetail": "${hasRichFeatures ? 'FULL features markdown with ### subsections, bullets, tables — copy from existing README and enhance' : 'optional full features section markdown with ### subsections, or empty string'}",
  "architecture": "detailed architecture with specifics",
  "usage": "markdown with ### headings and bash code blocks ONLY for commands — never wrap markdown headings inside code blocks",
  "testing": "testing instructions or empty string",
  "deployment": "build/deploy steps or empty string",
  "envVars": "env variable template as plain KEY=value lines",
  "projectStructure": "directory tree as plain text",
  "additionalSections": [{"title": "Section Name", "content": "full markdown including tables"}],
  "contributing": "step-by-step contribution guide",
  "license": "license name e.g. MIT"
}

additionalSections should include sections like: Technology Stack (with table), Key Routes (with table), AI Models, Firebase, Medical Disclaimer — whenever relevant to the repo.

Rules: Match or exceed existing README depth.${parsedExisting?.isSubstantial ? ' The existing README is the quality bar — do not shorten it.' : ''} Use \\n for line breaks. Escape quotes in strings.`
}

interface AIReadmeResponse {
  tagline?: unknown
  aim?: unknown
  description?: unknown
  problemStatement?: unknown
  targetAudience?: unknown
  features?: unknown
  featuresDetail?: unknown
  architecture?: unknown
  usage?: unknown
  testing?: unknown
  deployment?: unknown
  envVars?: unknown
  projectStructure?: unknown
  additionalSections?: unknown
  contributing?: unknown
  license?: unknown
}

/** Prefer the longer, more detailed version — never let AI replace rich content with generic short text. */
function preferLonger(aiVal: string, baselineVal: string, minRatio = 0.6): string {
  const ai = aiVal.trim()
  const base = baselineVal.trim()
  if (!ai) return base
  if (!base) return ai
  if (base.length > 200 && ai.length < base.length * minRatio) return base
  return ai.length >= base.length ? ai : base
}

function coerceAdditionalSections(
  value: unknown,
  fallback: GeneratedReadme['additionalSections'],
): GeneratedReadme['additionalSections'] {
  if (!value || !Array.isArray(value)) return fallback
  const sections = value
    .map((item) => {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        const title = toMarkdownString(obj.title)
        const content = toMarkdownString(obj.content)
        if (title && content) return { id: uid(), title, content }
      }
      return null
    })
    .filter(Boolean) as GeneratedReadme['additionalSections']

  if (sections.length === 0) return fallback

  // Merge with baseline — keep baseline sections AI didn't cover
  const titles = new Set(sections.map((s) => s.title.toLowerCase()))
  const merged = [...sections]
  for (const existing of fallback) {
    if (!titles.has(existing.title.toLowerCase())) merged.push(existing)
  }
  return merged
}

/** Normalize AI fields that may arrive as strings, arrays, or objects. */
function coerceString(value: unknown, fallback: string): string {
  return toMarkdownString(value, fallback)
}

function coerceFeatures(value: unknown, fallback: GeneratedReadme['features']): GeneratedReadme['features'] {
  if (!value) return fallback
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          if (typeof obj.text === 'string') return obj.text.trim()
          if (typeof obj.name === 'string') return obj.name.trim()
          if (typeof obj.description === 'string') return obj.description.trim()
        }
        return String(item).trim()
      })
      .filter(Boolean)
    if (items.length === 0) return fallback
    return items.map((text) => ({ id: uid(), text }))
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
      .map((text) => ({ id: uid(), text }))
  }
  return fallback
}

/** Extract the outermost JSON object using balanced-brace scanning (handles nested objects). */
function extractBalancedJson(text: string): string {
  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  const start = stripped.indexOf('{')
  if (start === -1) throw new Error('No JSON object found')

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\' && inString) {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return stripped.slice(start, i + 1)
    }
  }

  throw new Error('Unbalanced JSON braces')
}

function repairJson(json: string): string {
  return json
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
}

function tryParseAIResponse(content: string): AIReadmeResponse | null {
  const attempts = [
    () => JSON.parse(content.trim()) as AIReadmeResponse,
    () => JSON.parse(extractBalancedJson(content)) as AIReadmeResponse,
    () => JSON.parse(repairJson(extractBalancedJson(content))) as AIReadmeResponse,
  ]

  for (const attempt of attempts) {
    try {
      const parsed = attempt()
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      /* try next strategy */
    }
  }

  return null
}

let idSeq = 9000
function uid() {
  return String(++idSeq)
}

async function callChatAPI(
  options: AIAnalyzerOptions,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature: number,
): Promise<string> {
  const config = PROVIDERS[options.provider]
  const model = options.model || config.defaultModel

  const body: Record<string, unknown> = {
    model,
    temperature,
    messages,
    response_format: { type: 'json_object' },
  }

  const res = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[AI] ${options.provider} error ${res.status}:`, err.slice(0, 300))

    // Groq may reject json_object on some models — retry without it
    if (res.status === 400 && err.includes('response_format')) {
      delete body.response_format
      const retry = await fetch(config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify(body),
      })
      if (!retry.ok) {
        const retryErr = await retry.text()
        throw new Error(`AI analysis failed (${retry.status}): ${retryErr.slice(0, 200)}`)
      }
      const retryData = (await retry.json()) as { choices: { message: { content: string } }[] }
      const retryContent = retryData.choices[0]?.message?.content
      if (!retryContent) throw new Error('AI returned an empty response')
      return retryContent
    }

    if (res.status === 401) throw new Error(`Invalid ${options.provider} API key. Check your key and try again.`)
    if (res.status === 429) throw new Error('AI rate limit exceeded. Wait a moment or try another provider.')
    throw new Error(`AI analysis failed (${res.status}): ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('AI returned an empty response')
  return content
}

function mergeAIIntoReadme(baseline: GeneratedReadme, ai: AIReadmeResponse): GeneratedReadme {
  const aiFeaturesDetail = coerceString(ai.featuresDetail, '')
  const aiDescription = coerceString(ai.description, baseline.description)
  const aiUsage = coerceString(ai.usage, baseline.usage)

  return {
    ...baseline,
    tagline: preferLonger(coerceString(ai.tagline, baseline.tagline), baseline.tagline, 0.5),
    aim: preferLonger(coerceString(ai.aim, baseline.aim), baseline.aim),
    description: preferLonger(aiDescription, baseline.description),
    problemStatement: preferLonger(coerceString(ai.problemStatement, baseline.problemStatement), baseline.problemStatement),
    targetAudience: preferLonger(coerceString(ai.targetAudience, baseline.targetAudience), baseline.targetAudience),
    featuresDetail: preferLonger(aiFeaturesDetail, baseline.featuresDetail),
    features:
      aiFeaturesDetail.length > 100 || baseline.featuresDetail.length > 100
        ? []
        : coerceFeatures(ai.features, baseline.features),
    architecture: preferLonger(coerceString(ai.architecture, baseline.architecture), baseline.architecture),
    usage: preferLonger(aiUsage, baseline.usage),
    testing: preferLonger(coerceString(ai.testing, baseline.testing), baseline.testing),
    deployment: preferLonger(coerceString(ai.deployment, baseline.deployment), baseline.deployment),
    envVars: preferLonger(coerceString(ai.envVars, baseline.envVars), baseline.envVars),
    projectStructure: preferLonger(coerceString(ai.projectStructure, baseline.projectStructure), baseline.projectStructure),
    additionalSections: coerceAdditionalSections(ai.additionalSections, baseline.additionalSections),
    contributing: preferLonger(coerceString(ai.contributing, baseline.contributing), baseline.contributing),
    license: coerceString(ai.license, baseline.license) || baseline.license,
  }
}

export async function enhanceWithAI(
  ctx: RepoAIContext,
  options: AIAnalyzerOptions,
): Promise<{ readme: GeneratedReadme; model: string }> {
  const config = PROVIDERS[options.provider]
  const model = options.model || config.defaultModel

  const userPrompt = buildPrompt(ctx)
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]

  console.log(`[AI] Calling ${options.provider} model: ${model}`)

  let content = await callChatAPI(options, messages, 0.3)
  let ai = tryParseAIResponse(content)

  if (!ai) {
    console.warn('[AI] First response parse failed, retrying with correction prompt...')
    messages.push(
      { role: 'assistant', content: content.slice(0, 8000) },
      {
        role: 'user',
        content:
          'Your previous response was not valid JSON. Reply with ONLY a valid JSON object using the exact schema from my first message. Escape quotes inside strings. No markdown fences.',
      },
    )
    content = await callChatAPI(options, messages, 0.1)
    ai = tryParseAIResponse(content)
  }

  if (!ai) {
    console.error('[AI] Parse failed after retry. Response preview:', content.slice(0, 600))
    throw new Error(
      'AI returned invalid JSON after retry. Try OpenAI (GPT-4o-mini) instead of Groq, or scan again.',
    )
  }

  return { readme: normalizeReadme(mergeAIIntoReadme(ctx.baseline, ai)), model }
}

export function resolveAIKey(userKey: string | undefined, provider: AIProvider): string | null {
  if (userKey?.trim()) return userKey.trim()
  if (provider === 'openai' && process.env.OPENAI_API_KEY?.trim()) return process.env.OPENAI_API_KEY.trim()
  if (provider === 'groq' && process.env.GROQ_API_KEY?.trim()) return process.env.GROQ_API_KEY.trim()
  return null
}
