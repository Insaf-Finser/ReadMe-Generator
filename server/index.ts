import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseRepoUrl } from './parseRepoUrl'
import { GitHubClient } from './github'
import { analyzeRepository } from './analyzeRepo'
import { resolveAIKey } from './aiAnalyzer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '../dist')

const app = express()
const PORT = Number(process.env.PORT) || 3001
const isProduction = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiSupported: true, version: 2 })
})

app.get('/api/config', (_req, res) => {
  res.json({
    aiSupported: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY?.trim()),
    hasGitHubToken: Boolean(process.env.GITHUB_TOKEN?.trim()),
  })
})

app.post('/api/analyze', async (req, res) => {
  try {
    const { url, token, useAI, aiProvider, aiApiKey, aiModel, userDescription } = req.body as {
      url?: string
      token?: string
      useAI?: boolean
      aiProvider?: 'openai' | 'groq'
      aiApiKey?: string
      aiModel?: string
      userDescription?: string
    }

    if (!url?.trim()) {
      res.status(400).json({ error: 'Repository URL is required' })
      return
    }

    const wantsAI = useAI === true || useAI === 'true'
    const provider = aiProvider ?? 'openai'

    if (wantsAI) {
      const resolvedKey = resolveAIKey(aiApiKey, provider)
      if (!resolvedKey) {
        res.status(400).json({
          error: `AI mode requires an API key. Enter your ${provider === 'groq' ? 'Groq' : 'OpenAI'} key in the form, or set ${provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'} in a .env file and restart the server.`,
        })
        return
      }
      console.log(`[AI] Starting ${provider} analysis for ${url}`)
    }

    const { owner, repo } = parseRepoUrl(url)
    const client = new GitHubClient(token)
    const result = await analyzeRepository(client, owner, repo, (step) => {
      if (wantsAI) console.log(`[scan] ${step}`)
    }, {
      useAI: wantsAI,
      aiProvider: provider,
      aiApiKey,
      aiModel,
      userDescription,
    })

    if (wantsAI && !result.summary.aiEnhanced) {
      res.status(500).json({ error: 'AI analysis was requested but did not complete. Restart the server with npm run dev and try again.' })
      return
    }

    if (result.summary.aiEnhanced) {
      console.log(`[AI] Done — ${result.summary.aiProvider}/${result.summary.aiModel}`)
    }

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze repository'
    console.error('[analyze]', message)
    res.status(400).json({ error: message })
  }
})

// Production: serve built React app from the same server as the API
if (isProduction) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, () => {
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim())
  const groq = Boolean(process.env.GROQ_API_KEY?.trim())
  console.log(`Server running on http://localhost:${PORT}${isProduction ? ' (production)' : ''}`)
  console.log(`AI keys loaded — OpenAI: ${openai ? 'yes' : 'no'}, Groq: ${groq ? 'yes' : 'no'}`)
})
