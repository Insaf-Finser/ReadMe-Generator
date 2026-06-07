import { useEffect, useMemo, useState } from 'react'
import { FileText, Github, Pencil, RotateCcw, Scan } from 'lucide-react'
import { analyzeRepo, type ScanOptions, type ScanSummary as ScanSummaryType } from './api'
import { ReadmeForm } from './components/ReadmeForm'
import { PreviewPanel } from './components/PreviewPanel'
import { RepoScanner } from './components/RepoScanner'
import { ScanSummary } from './components/ScanSummary'
import { LoadingSteps } from './components/LoadingSteps'
import { generateMarkdown } from './generateMarkdown'
import type { ReadmeData } from './types'

type View = 'scan' | 'loading' | 'result'

export default function App() {
  const [view, setView] = useState<View>('scan')
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<ScanSummaryType | null>(null)
  const [data, setData] = useState<ReadmeData | null>(null)
  const [leftTab, setLeftTab] = useState<'summary' | 'edit'>('summary')
  const [useAI, setUseAI] = useState(false)

  const markdown = useMemo(() => (data ? generateMarkdown(data) : ''), [data])

  useEffect(() => {
    if (view !== 'loading') return

    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < 5 ? s + 1 : s))
    }, 1200)

    return () => clearInterval(interval)
  }, [view])

  const handleScan = async (url: string, options: ScanOptions) => {
    setError(null)
    setUseAI(Boolean(options.useAI))
    setView('loading')
    setLoadingStep(0)

    try {
      const result = await analyzeRepo(url, options)
      setSummary(result.summary)
      setData(result.readme)
      setView('result')
      setLeftTab('summary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setView('scan')
    }
  }

  const reset = () => {
    setView('scan')
    setSummary(null)
    setData(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="logo">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="header-title">README Generator</h1>
            <p className="header-subtitle">Scan any GitHub repo and auto-generate a README</p>
          </div>
        </div>
        <div className="header-actions">
          {view === 'result' && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              <RotateCcw size={16} />
              New scan
            </button>
          )}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <Github size={16} />
            GitHub
          </a>
        </div>
      </header>

      {view === 'scan' && (
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <Scan size={14} />
              Repo-powered generation
            </div>
            <h2 className="hero-title">Turn any repository into a polished README</h2>
            <p className="hero-desc">
              We analyze your repo&apos;s file structure, dependencies, languages, CI setup, and more — then draft a complete README you can copy or download.
            </p>
            <RepoScanner onScan={handleScan} loading={false} error={error} />
          </div>
        </section>
      )}

      {view === 'loading' && (
        <section className="hero hero-loading">
          <LoadingSteps activeStep={loadingStep} useAI={useAI} />
        </section>
      )}

      {view === 'result' && data && summary && (
        <main className="main">
          <aside className="form-panel">
            <div className="panel-tabs">
              <button
                type="button"
                className={`panel-tab ${leftTab === 'summary' ? 'panel-tab-active' : ''}`}
                onClick={() => setLeftTab('summary')}
              >
                <Scan size={16} />
                Scan results
              </button>
              <button
                type="button"
                className={`panel-tab ${leftTab === 'edit' ? 'panel-tab-active' : ''}`}
                onClick={() => setLeftTab('edit')}
              >
                <Pencil size={16} />
                Edit README
              </button>
            </div>
            {leftTab === 'summary' ? (
              <ScanSummary summary={summary} />
            ) : (
              <ReadmeForm data={data} onChange={setData} />
            )}
          </aside>
          <section className="preview-section">
            <PreviewPanel markdown={markdown} />
          </section>
        </main>
      )}

      <footer className="footer">
        <p>
          {view === 'result'
            ? 'README generated from repository scan. Edit fields on the left to refine the output.'
            : 'Scans public GitHub repositories via the GitHub API. Optional token increases rate limits.'}
        </p>
      </footer>
    </div>
  )
}
