import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Github, Key, Loader2, Search, Sparkles } from 'lucide-react'
import { fetchServerConfig, type AIProvider, type ScanOptions, type ServerConfig } from '../api'

interface RepoScannerProps {
  onScan: (url: string, options: ScanOptions) => void
  loading: boolean
  error: string | null
}

export function RepoScanner({ onScan, loading, error }: RepoScannerProps) {
  const [url, setUrl] = useState('')
  const [userDescription, setUserDescription] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai')
  const [aiApiKey, setAiApiKey] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)

  useEffect(() => {
    fetchServerConfig().then(setServerConfig)
  }, [])

  const serverHasKey =
    serverConfig &&
    ((aiProvider === 'openai' && serverConfig.hasOpenAIKey) ||
      (aiProvider === 'groq' && serverConfig.hasGroqKey))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!url.trim() || loading) return

    if (useAI && !aiApiKey.trim() && !serverHasKey) {
      setLocalError(
        `AI mode requires an API key. Paste your ${aiProvider === 'groq' ? 'Groq' : 'OpenAI'} key below, or add it to a .env file and restart the server.`,
      )
      return
    }

    if (!serverConfig) {
      setLocalError('API server not reachable. Run npm run dev in the project folder (starts both frontend and backend).')
      return
    }

    onScan(url.trim(), {
      githubToken: githubToken.trim() || undefined,
      useAI,
      aiProvider,
      aiApiKey: aiApiKey.trim() || undefined,
      userDescription: userDescription.trim() || undefined,
    })
  }

  const displayError = localError || error

  return (
    <div className="repo-scanner">
      {serverConfig === null && (
        <div className="scanner-error">
          <AlertCircle size={16} />
          API server not running. Start it with <code>npm run dev</code>
        </div>
      )}

      <form className="scanner-form" onSubmit={handleSubmit}>
        <div className="scanner-input-wrap">
          <Github className="scanner-icon" size={20} />
          <input
            className="scanner-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="btn btn-primary scanner-btn" disabled={loading || !url.trim()}>
            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            {loading ? 'Scanning...' : 'Generate README'}
          </button>
        </div>

        <div className="user-description-field">
          <label className="form-label" htmlFor="user-description">
            Project description <span className="label-optional">(optional)</span>
          </label>
          <textarea
            id="user-description"
            className="textarea user-description-input"
            rows={4}
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder="Describe what your project does, who it's for, and its main goal. The AI uses this together with the repo scan to write a more accurate README."
            disabled={loading}
          />
        </div>

        <div className="analysis-mode">
          <label className={`mode-card ${!useAI ? 'mode-card-active' : ''}`}>
            <input
              type="radio"
              name="mode"
              checked={!useAI}
              onChange={() => setUseAI(false)}
              disabled={loading}
            />
            <div>
              <strong>Standard scan</strong>
              <span>Rule-based — free, no API key</span>
            </div>
          </label>
          <label className={`mode-card ${useAI ? 'mode-card-active' : ''}`}>
            <input
              type="radio"
              name="mode"
              checked={useAI}
              onChange={() => setUseAI(true)}
              disabled={loading}
            />
            <Sparkles size={18} className="mode-icon" />
            <div>
              <strong>AI-enhanced</strong>
              <span>GPT-4o-mini or Groq Llama 3.3</span>
            </div>
          </label>
        </div>

        {useAI && (
          <div className="ai-options">
            <div className="ai-provider-row">
              <label className="form-label">AI Provider</label>
              <select
                className="input"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                disabled={loading}
              >
                <option value="openai">OpenAI — GPT-4o-mini (best quality)</option>
                <option value="groq">Groq — Llama 3.3 70B (fast, free tier)</option>
              </select>
            </div>
            <input
              className="input token-input"
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={aiProvider === 'groq' ? 'Groq API key (gsk_...)' : 'OpenAI API key (sk-...)'}
              disabled={loading}
              required={useAI && !serverHasKey}
            />
            {serverHasKey && !aiApiKey && (
              <p className="ai-key-ok">
                <CheckCircle2 size={14} />
                Server has a {aiProvider === 'groq' ? 'Groq' : 'OpenAI'} key from .env — optional to enter one here
              </p>
            )}
            <p className="ai-hint">
              Get a free Groq key at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">console.groq.com</a>
              {' '}or OpenAI at{' '}
              <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a>.
            </p>
          </div>
        )}

        <button
          type="button"
          className="token-toggle"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <Key size={14} />
          {showAdvanced ? 'Hide' : 'Show'} GitHub token (optional)
        </button>

        {showAdvanced && (
          <input
            className="input token-input"
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_... (higher GitHub rate limits)"
            disabled={loading}
          />
        )}
      </form>

      {displayError && (
        <div className="scanner-error">
          <AlertCircle size={16} />
          {displayError}
        </div>
      )}

      <p className="scanner-hint">
        {useAI
          ? 'AI mode combines your description with repo scan data to write a detailed README.'
          : 'Standard mode uses your description plus the file tree scan — no AI API key needed.'}
      </p>
    </div>
  )
}
