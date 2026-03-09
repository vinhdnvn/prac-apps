import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Code string ───────────────────────────────────────────────────────────────

const binaryCode = `class Solution(object):
    def nextGreatestLetter(self, letters, target):
        low, high = 0, len(letters) - 1
        result = 0  # default: wrap around → letters[0]

        while low <= high:
            mid = (low + high) // 2
            if target < letters[mid]:
                result = mid   # candidate found, tìm tiếp bên trái
                high = mid - 1
            else:
                low = mid + 1  # target >= letters[mid], tìm bên phải

        return letters[result]`

// ─── Compute result (same logic as the algorithm) ──────────────────────────────

function computeResult(letters, target) {
  let low = 0, high = letters.length - 1, result = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (target < letters[mid]) { result = mid; high = mid - 1 }
    else { low = mid + 1 }
  }
  return result
}

// ─── Letter Array Visual ──────────────────────────────────────────────────────

function LetterVisual({ letters, target }) {
  const resultIdx = computeResult(letters, target)
  const answer = letters[resultIdx]
  const wraps = letters.every(l => l <= target)

  return (
    <div className="ngl-visual">
      <div className="ngl-array">
        {letters.map((l, i) => (
          <div
            key={i}
            className={`ngl-letter ${i === resultIdx ? 'ngl-letter--answer' : l <= target ? 'ngl-letter--lte' : ''}`}
          >
            {l}
            {i === resultIdx && <span className="ngl-answer-badge">result</span>}
          </div>
        ))}
      </div>
      <div className="ngl-result-line">
        <span>target = <strong>'{target}'</strong></span>
        <span className="ngl-arrow">→</span>
        <span className="ngl-result-val">'{answer}'</span>
        {wraps && (
          <span className="ngl-wrap-note">↩ wrap around (all letters ≤ target)</span>
        )}
      </div>
    </div>
  )
}

// ─── Approach panel ───────────────────────────────────────────────────────────

function BinaryPanel() {
  return (
    <div className="coin-panel">
      <div className="coin-insights">
        <div className="coin-insight">
          <span className="coin-ic">💡</span>
          <p>Array đã sort → Binary Search. Thay vì scan linear O(n), tìm ký tự nhỏ nhất &gt; target trong O(log n).</p>
        </div>
        <div className="coin-insight">
          <span className="coin-ic">🎯</span>
          <p>
            Mấu chốt: mỗi khi <code>target &lt; letters[mid]</code>, ta tìm thấy một candidate — lưu <code>result = mid</code>
            rồi tiếp tục tìm bên trái. Có thể còn letter nào <strong>nhỏ hơn mà vẫn &gt; target</strong> không?
          </p>
        </div>
        <div className="coin-insight">
          <span className="coin-ic">🔄</span>
          <p>
            <strong>Wrap-around tự động:</strong> khởi tạo <code>result = 0</code> từ đầu.
            Nếu toàn bộ letters ≤ target → không bao giờ vào nhánh <code>if</code> → result vẫn là 0
            → trả về <code>letters[0]</code>. Circular handled mà không cần check riêng!
          </p>
        </div>
      </div>
      <div className="coin-code-wrap">
        <div className="coin-code-bar">
          <span className="coin-code-lang">python</span>
          <span className="coin-code-cx cx--log">O(log n)</span>
        </div>
        <pre className="pcard-code"><code>{binaryCode}</code></pre>
      </div>
      <div className="coin-verdict coin-verdict--best">
        O(log n) time · O(1) space — wrap-around handled tự động, không cần xử lý edge case riêng.
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LETTERS = ['c', 'f', 'j']
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('')

const TEST_CASES = [
  [['c', 'f', 'j'], 'a', 'c'],
  [['c', 'f', 'j'], 'c', 'f'],
  [['c', 'f', 'j'], 'd', 'f'],
  [['c', 'f', 'j'], 'g', 'j'],
  [['c', 'f', 'j'], 'j', 'c'],
  [['c', 'f', 'j'], 'z', 'c'],
  [['x', 'x', 'y', 'y'], 'x', 'y'],
  [['a', 'b'], 'z', 'a'],
]

export default function NextGreatestLetter() {
  const navigate = useNavigate()
  const [target, setTarget] = useState('a')

  return (
    <div className="page ngl-page">
      <button className="back-btn" onClick={() => navigate('/dsa')}>← Back</button>

      <h1 className="page-title">Find Smallest Letter Greater Than Target</h1>
      <p className="page-tags">Binary Search · Array · Circular · Easy</p>

      <p className="ngl-problem-desc">
        Cho mảng <strong>letters</strong> (đã sort, circular) và <strong>target</strong>.
        Tìm ký tự nhỏ nhất trong letters mà <em>strictly lớn hơn</em> target.
        Nếu không có, trả về <code>letters[0]</code> (wrap around).
      </p>

      {/* ── Simulator ── */}
      <div className="coin-sim">
        <div className="ngl-sim-header">
          <div className="ngl-sim-label">
            letters = [{LETTERS.map(l => `'${l}'`).join(', ')}]
          </div>
          <div className="ngl-target-row">
            <span className="ngl-target-label">target =</span>
            <div className="ngl-alphabet">
              {ALPHABET.map(ch => (
                <button
                  key={ch}
                  className={`ngl-char-btn ${target === ch ? 'ngl-char-btn--on' : ''}`}
                  onClick={() => setTarget(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
        <LetterVisual letters={LETTERS} target={target} />
      </div>

      {/* ── Approach ── */}
      <div className="coin-section-label">Phân tích approach — Binary Search</div>
      <BinaryPanel />

      {/* ── Test cases ── */}
      <div className="coin-section-label" style={{ marginTop: 24 }}>Test Cases</div>
      <table className="md-table">
        <thead>
          <tr>
            <th className="md-th">letters</th>
            <th className="md-th">target</th>
            <th className="md-th">expected</th>
            <th className="md-th">result</th>
            <th className="md-th">pass?</th>
          </tr>
        </thead>
        <tbody>
          {TEST_CASES.map(([ls, t, expected], i) => {
            const idx = computeResult(ls, t)
            const result = ls[idx]
            const pass = result === expected
            return (
              <tr key={i}>
                <td className="md-td" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  [{ls.map(l => `'${l}'`).join(', ')}]
                </td>
                <td className="md-td" style={{ fontFamily: 'monospace' }}>'{t}'</td>
                <td className="md-td" style={{ fontFamily: 'monospace' }}>'{expected}'</td>
                <td className="md-td" style={{ fontFamily: 'monospace' }}>'{result}'</td>
                <td className="md-td" style={{ color: pass ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {pass ? '✓' : '✗'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
