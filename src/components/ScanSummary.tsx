import { Container, FlaskConical, GitBranch, Sparkles, Star, Workflow } from 'lucide-react'
import type { ScanSummary as ScanSummaryType } from '../api'

interface ScanSummaryProps {
  summary: ScanSummaryType
}

export function ScanSummary({ summary }: ScanSummaryProps) {
  return (
    <div className="scan-summary">
      <div className="summary-header">
        <a href={summary.url} target="_blank" rel="noopener noreferrer" className="summary-repo-link">
          {summary.owner}/{summary.repo}
        </a>
        <span className="summary-meta">
          <Star size={14} /> {summary.stars.toLocaleString()} stars
        </span>
      </div>

      {summary.hadExistingReadme && (
        <p className="summary-user-desc">Built on your existing README — tables, routes, and technical details preserved.</p>
      )}

      {summary.userDescriptionProvided && !summary.hadExistingReadme && (
        <p className="summary-user-desc">Generated using your project description + repo scan.</p>
      )}

      {summary.aiEnhanced && (
        <div className="ai-badge">
          <Sparkles size={14} />
          AI-enhanced with {summary.aiProvider} ({summary.aiModel})
        </div>
      )}

      <div className="summary-stats">
        <div className="stat-card">
          <GitBranch size={16} />
          <span>{summary.fileCount} files scanned</span>
        </div>
        {summary.hasTests && (
          <div className="stat-card">
            <FlaskConical size={16} />
            <span>Tests detected</span>
          </div>
        )}
        {summary.hasCi && (
          <div className="stat-card">
            <Workflow size={16} />
            <span>CI/CD</span>
          </div>
        )}
        {summary.hasDocker && (
          <div className="stat-card">
            <Container size={16} />
            <span>Docker</span>
          </div>
        )}
      </div>

      {summary.languages.length > 0 && (
        <div className="summary-section">
          <h3 className="summary-label">Languages</h3>
          <div className="lang-bars">
            {summary.languages.slice(0, 6).map((lang) => (
              <div key={lang.name} className="lang-row">
                <span className="lang-name">{lang.name}</span>
                <div className="lang-bar-track">
                  <div className="lang-bar-fill" style={{ width: `${lang.percent}%` }} />
                </div>
                <span className="lang-pct">{lang.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.detectedStack.length > 0 && (
        <div className="summary-section">
          <h3 className="summary-label">Detected Stack</h3>
          <div className="tag-list">
            {summary.detectedStack.map((tech) => (
              <span key={tech} className="tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {summary.topics.length > 0 && (
        <div className="summary-section">
          <h3 className="summary-label">Topics</h3>
          <div className="tag-list tag-list-muted">
            {summary.topics.map((topic) => (
              <span key={topic} className="tag tag-muted">{topic}</span>
            ))}
          </div>
        </div>
      )}

      {summary.treeTruncated && (
        <p className="summary-warning">File tree was truncated by GitHub (very large repo). Structure may be partial.</p>
      )}
    </div>
  )
}
