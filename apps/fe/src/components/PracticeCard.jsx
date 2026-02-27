import { useState } from 'react'

const difficultyStyle = {
  easy:   { background: '#1a4731', color: '#34d399' },
  medium: { background: '#2d2208', color: '#fbbf24' },
  hard:   { background: '#3b1219', color: '#f87171' },
}

export default function PracticeCard({ title, difficulty, tags = [], description, explanation, code, onClick, isLink }) {
  const [expanded, setExpanded] = useState(false)
  const diff = difficultyStyle[difficulty] ?? difficultyStyle.easy
  const hasContent = !isLink && (explanation || code)

  const handleClick = () => {
    if (isLink) { onClick?.(); return }
    if (hasContent) setExpanded(p => !p)
    onClick?.()
  }

  return (
    <div className={`practice-card-item ${expanded ? 'expanded' : ''} ${isLink ? 'pcard-link' : ''}`} onClick={handleClick}>
      <div className="pcard-header">
        <span className="pcard-title">{title}</span>
        <div className="pcard-header-right">
          <span className="pcard-difficulty" style={diff}>{difficulty}</span>
          {isLink && <span className="pcard-toggle">→</span>}
          {!isLink && hasContent && <span className="pcard-toggle">{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>

      {description && <p className="pcard-desc">{description}</p>}

      {tags.length > 0 && (
        <div className="pcard-tags">
          {tags.map(tag => (
            <span key={tag} className="pcard-tag">{tag}</span>
          ))}
        </div>
      )}

      {expanded && hasContent && (
        <div className="pcard-content" onClick={e => e.stopPropagation()}>
          {explanation && (
            <div className="pcard-explanation">
              {explanation.map((block, i) =>
                block.type === 'text' ? (
                  <p key={i} className="pcard-text">{block.value}</p>
                ) : block.type === 'step' ? (
                  <div key={i} className="pcard-step">
                    <span className="pcard-step-num">{block.num}</span>
                    <span>{block.value}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          {code && (
            <div className="pcard-code-block">
              <div className="pcard-code-header">
                <span className="pcard-code-lang">{code.lang}</span>
                <span className="pcard-code-complexity">{code.complexity}</span>
              </div>
              <pre className="pcard-code"><code>{code.value}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
