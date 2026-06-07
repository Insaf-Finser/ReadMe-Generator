import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Download } from 'lucide-react'

interface PreviewPanelProps {
  markdown: string
}

export function PreviewPanel({ markdown }: PreviewPanelProps) {
  const [tab, setTab] = useState<'preview' | 'raw'>('preview')
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'README.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="preview-panel">
      <div className="preview-bar">
        <div className="preview-tabs">
          <button type="button" className={`preview-tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>
            Preview
          </button>
          <button type="button" className={`preview-tab ${tab === 'raw' ? 'active' : ''}`} onClick={() => setTab('raw')}>
            Raw
          </button>
        </div>
        <div className="preview-actions">
          <button type="button" className="btn-ghost-sm" onClick={copyToClipboard}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn-accent-sm" onClick={download}>
            <Download size={14} />
            Save
          </button>
        </div>
      </div>

      <div className="preview-body">
        {tab === 'preview' ? (
          <article className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        ) : (
          <pre className="raw-md"><code>{markdown}</code></pre>
        )}
      </div>
    </div>
  )
}
