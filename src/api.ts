import type { ReadmeData } from './types'

export type AIProvider = 'openai' | 'groq'

export interface ScanOptions {
  githubToken?: string
  useAI?: boolean
  aiProvider?: AIProvider
  aiApiKey?: string
  userDescription?: string
}

export interface ServerConfig {
  aiSupported: boolean
  hasOpenAIKey: boolean
  hasGroqKey: boolean
  hasGitHubToken: boolean
}

export interface ScanSummary {
  owner: string
  repo: string
  url: string
  defaultBranch: string
  fileCount: number
  languages: { name: string; bytes: number; percent: number }[]
  detectedStack: string[]
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
  topics: string[]
  stars: number
  treeTruncated: boolean
  aiEnhanced: boolean
  aiProvider?: string
  aiModel?: string
  userDescriptionProvided: boolean
  hadExistingReadme: boolean
}

export interface AnalyzeResponse {
  summary: ScanSummary
  readme: ReadmeData
}

export async function fetchServerConfig(): Promise<ServerConfig | null> {
  try {
    const res = await fetch('/api/config')
    if (!res.ok) return null
    return res.json() as Promise<ServerConfig>
  } catch {
    return null
  }
}

export async function analyzeRepo(url: string, options: ScanOptions = {}): Promise<AnalyzeResponse> {
  const useAI = Boolean(options.useAI)

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      token: options.githubToken || undefined,
      useAI,
      aiProvider: options.aiProvider || 'openai',
      aiApiKey: options.aiApiKey || undefined,
      userDescription: options.userDescription || undefined,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data.error ?? 'Failed to analyze repository'
    if (msg.includes('fetch') || res.status === 502) {
      throw new Error('Cannot reach API server. Run npm run dev (starts both frontend and backend).')
    }
    throw new Error(msg)
  }

  if (useAI && !data.summary?.aiEnhanced) {
    throw new Error(
      'AI mode was selected but the server did not run AI analysis. Restart with npm run dev and ensure your API key is valid.',
    )
  }

  return data as AnalyzeResponse
}
