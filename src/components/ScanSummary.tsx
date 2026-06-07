import type { ScanSummary as ScanSummaryType } from '../api'

interface ScanSummaryProps {
  summary: ScanSummaryType
}

export function ScanSummary({ summary }: ScanSummaryProps) {
  return (
    <div className="scan-summary">
      <a href={summary.url} target="_blank" rel="noopener noreferrer" className="repo-link">
        {summary.owner}/{summary.repo}
      </a>
      <p className="repo-meta">{summary.fileCount.toLocaleString()} files · {summary.stars.toLocaleString()} stars</p>

      {(summary.hadExistingReadme || summary.userDescriptionProvided || summary.aiEnhanced) && (
        <div className="scan-tags">
          {summary.hadExistingReadme && <span className="scan-tag">Existing README</span>}
          {summary.userDescriptionProvided && <span className="scan-tag">Your description</span>}
          {summary.aiEnhanced && <span className="scan-tag accent">AI · {summary.aiModel}</span>}
        </div>
      )}

      {summary.languages.length > 0 && (
        <div className="summary-block">
          <h3 className="summary-heading">Languages</h3>
          <div className="lang-bars">
            {summary.languages.slice(0, 5).map((lang) => (
              <div key={lang.name} className="lang-row">
                <span className="lang-name">{lang.name}</span>
                <div className="lang-track">
                  <div className="lang-fill" style={{ width: `${lang.percent}%` }} />
                </div>
                <span className="lang-pct">{lang.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.detectedStack.length > 0 && (
        <div className="summary-block">
          <h3 className="summary-heading">Stack</h3>
          <div className="chip-row">
            {summary.detectedStack.map((tech) => (
              <span key={tech} className="chip">{tech}</span>
            ))}
          </div>
        </div>
      )}

      <div className="chip-row subtle">
        {summary.hasTests && <span className="chip">Tests</span>}
        {summary.hasCi && <span className="chip">CI</span>}
        {summary.hasDocker && <span className="chip">Docker</span>}
      </div>
    </div>
  )
}
