import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Download, Eye, FileCode } from 'lucide-react'

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
      <div className="preview-toolbar">
        <div className="tab-group">
          <button
            type="button"
            className={`tab ${tab === 'preview' ? 'tab-active' : ''}`}
            onClick={() => setTab('preview')}
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            type="button"
            className={`tab ${tab === 'raw' ? 'tab-active' : ''}`}
            onClick={() => setTab('raw')}
          >
            <FileCode size={16} />
            Markdown
          </button>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={download}>
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      <div className="preview-content">
        {tab === 'preview' ? (
          <article className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        ) : (
          <pre className="raw-markdown">
            <code>{markdown}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
