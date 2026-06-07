import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, ChevronDown, Loader2 } from 'lucide-react'
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
  const [showSettings, setShowSettings] = useState(false)
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
      setLocalError(`Add an ${aiProvider === 'groq' ? 'Groq' : 'OpenAI'} key in settings or .env`)
      setShowSettings(true)
      return
    }

    if (!serverConfig) {
      setLocalError('Server offline — run npm run dev')
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
    <div className="scanner">
      {serverConfig === null && (
        <p className="scanner-offline">Server offline · run <code>npm run dev</code></p>
      )}

      <form className="scanner-form" onSubmit={handleSubmit}>
        <div className="url-field">
          <input
            className="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com/owner/repo"
            disabled={loading}
            autoFocus
          />
        </div>

        <textarea
          className="desc-input"
          rows={3}
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          placeholder="What does your project do? (optional)"
          disabled={loading}
        />

        <div className="mode-row">
          <div className="mode-pills">
            <button
              type="button"
              className={`mode-pill ${!useAI ? 'active' : ''}`}
              onClick={() => setUseAI(false)}
              disabled={loading}
            >
              Scan
            </button>
            <button
              type="button"
              className={`mode-pill ${useAI ? 'active' : ''}`}
              onClick={() => setUseAI(true)}
              disabled={loading}
            >
              AI
            </button>
          </div>

          <button
            type="button"
            className="settings-toggle"
            onClick={() => setShowSettings((v) => !v)}
          >
            Settings
            <ChevronDown size={14} className={showSettings ? 'flip' : ''} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            {useAI && (
              <>
                <select
                  className="input-minimal"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                  disabled={loading}
                >
                  <option value="openai">OpenAI</option>
                  <option value="groq">Groq</option>
                </select>
                {!serverHasKey && (
                  <input
                    className="input-minimal"
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="API key"
                    disabled={loading}
                  />
                )}
                {serverHasKey && <p className="key-loaded">Key loaded from .env</p>}
              </>
            )}
            <input
              className="input-minimal"
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="GitHub token (optional)"
              disabled={loading}
            />
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" />
              Generating
            </>
          ) : (
            <>
              Generate README
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {displayError && (
        <div className="scanner-error">
          <AlertCircle size={15} />
          {displayError}
        </div>
      )}
    </div>
  )
}
