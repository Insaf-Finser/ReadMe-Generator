import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Sparkles } from 'lucide-react'
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
      <div className="bg-grid" aria-hidden />

      <header className="header">
        <button type="button" className="wordmark" onClick={reset}>
          readme<span className="wordmark-dot">.</span>gen
        </button>
        {view === 'result' && (
          <button type="button" className="btn-text" onClick={reset}>
            <ArrowLeft size={15} />
            New
          </button>
        )}
      </header>

      {view === 'scan' && (
        <section className="hero">
          <div className="hero-inner">
            <p className="hero-eyebrow">GitHub → README</p>
            <h1 className="hero-title">
              Your repo,
              <br />
              <em>documented.</em>
            </h1>
            <p className="hero-lead">
              Paste a link. We scan the codebase and draft a README — aim, stack, setup, and all.
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
        <main className="workspace">
          <aside className="sidebar">
            <nav className="sidebar-nav">
              <button
                type="button"
                className={`sidebar-tab ${leftTab === 'summary' ? 'active' : ''}`}
                onClick={() => setLeftTab('summary')}
              >
                <Sparkles size={14} />
                Scan
              </button>
              <button
                type="button"
                className={`sidebar-tab ${leftTab === 'edit' ? 'active' : ''}`}
                onClick={() => setLeftTab('edit')}
              >
                <Pencil size={14} />
                Edit
              </button>
            </nav>
            <div className="sidebar-body">
              {leftTab === 'summary' ? (
                <ScanSummary summary={summary} />
              ) : (
                <ReadmeForm data={data} onChange={setData} />
              )}
            </div>
          </aside>
          <section className="preview-pane">
            <PreviewPanel markdown={markdown} />
          </section>
        </main>
      )}
    </div>
  )
}
