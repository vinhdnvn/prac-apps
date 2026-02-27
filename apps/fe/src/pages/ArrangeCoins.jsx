import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Code strings ─────────────────────────────────────────────────────────────

const bruteCode = `def arrangeCoins(n):
    k = 1   # current row
    r = 0   # complete rows

    while n >= 0:
        if n - k >= 0:
            r += 1      # row k hoàn thành
            n = n - k   # trừ đi k coins
        else:
            return r    # không đủ coins cho row tiếp
        k += 1

    return r

# Ban đầu tưởng O(n) vì while loop...
# Nhưng loop chạy k lần, không phải n lần!
# 1+2+...+k = k(k+1)/2 ≈ n  →  k ≈ √(2n)  →  O(√n)`

const binaryCode = `def arrangeCoins(n):
    # Tìm k lớn nhất sao cho k(k+1)/2 <= n
    # k nằm trong [0, n]  →  Binary Search!
    l, r = 0, n

    while l <= r:
        mid = (l + r) // 2
        total = mid * (mid + 1) // 2  # tổng coins sau mid rows

        if total == n:
            return mid
        elif total <= n:
            l = mid + 1   # chưa đủ → thử nhiều row hơn
        else:
            r = mid - 1   # quá nhiều → giảm xuống

    return r
    # Khi kết thúc: r là k lớn nhất mà k(k+1)/2 ≤ n`

const mathCode = `from math import sqrt

def arrangeCoins(n):
    # k(k+1)/2 <= n
    # k^2 + k - 2n <= 0
    # Quadratic formula (a=1, b=1, c=-2n):
    # k = (-1 + sqrt(1 + 8n)) / 2
    return int((sqrt(1 + 8 * n) - 1) // 2)`

// ─── Staircase visual ─────────────────────────────────────────────────────────

function Staircase({ n }) {
  const k = Math.floor((Math.sqrt(1 + 8 * n) - 1) / 2)
  const rows = []
  let remaining = n
  for (let row = 1; row <= k + 1 && remaining > 0; row++) {
    const coins = Math.min(remaining, row)
    rows.push({ row, coins, complete: coins === row })
    remaining -= coins
  }

  if (n === 0) {
    return <div className="coin-staircase"><span className="coin-empty-msg">n = 0 → không có row nào</span></div>
  }

  return (
    <div className="coin-staircase">
      {rows.map(({ row, coins, complete }) => (
        <div key={row} className="coin-row">
          <span className="coin-row-num">{row}</span>
          <div className="coin-dots">
            {Array.from({ length: row }, (_, i) => (
              <span key={i} className={`coin-dot ${i < coins ? 'coin-dot--on' : 'coin-dot--off'}`}>
                {i < coins ? '●' : '○'}
              </span>
            ))}
          </div>
          <span className={`coin-row-badge ${complete ? 'coin-badge--ok' : 'coin-badge--inc'}`}>
            {complete ? '✓ complete' : `${coins}/${row} incomplete`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Approach panels ──────────────────────────────────────────────────────────

function BrutePanel() {
  return (
    <div className="coin-panel">
      <div className="coin-insights">
        <div className="coin-insight">
          <span className="coin-ic">💭</span>
          <p>Hướng đơn giản nhất: duyệt từng row, trừ dần coins ra khỏi n, đếm số row hoàn thành.</p>
        </div>
        <div className="coin-insight">
          <span className="coin-ic">😅</span>
          <p>Ban đầu nghĩ loop chạy n lần nên O(n)... <strong>sai.</strong> Loop chạy đến khi n &lt; k, tức là k lần thôi.</p>
        </div>
        <div className="coin-insight">
          <span className="coin-ic">📐</span>
          <p>Tổng coins sau k rows = 1+2+...+k = <strong>k(k+1)/2</strong>. Đây xấp xỉ n, nên k ≈ √(2n). Big-O thực sự là <strong>O(√n)</strong>.</p>
        </div>
      </div>
      <div className="coin-code-wrap">
        <div className="coin-code-bar">
          <span className="coin-code-lang">python</span>
          <span className="coin-code-cx cx--sqrt">O(√n)</span>
        </div>
        <pre className="pcard-code"><code>{bruteCode}</code></pre>
      </div>
      <div className="coin-verdict coin-verdict--ok">
        Không tệ — O(√n) chứ không phải O(n). Nhưng vẫn còn loop, có thể tốt hơn không?
      </div>
    </div>
  )
}

function BinaryPanel() {
  return (
    <div className="coin-panel">
      <div className="coin-insights">
        <div className="coin-insight">
          <span className="coin-ic">💡</span>
          <p>Nhận ra từ Approach 1: bài toán thực chất là tìm <strong>k lớn nhất</strong> sao cho <code>k(k+1)/2 ≤ n</code>.</p>
        </div>
        <div className="coin-insight">
          <span className="coin-ic">🎯</span>
          <p>k nằm trong khoảng <strong>[0, n]</strong> — search space rõ ràng, có giới hạn trên và dưới → Binary Search được!</p>
        </div>
        <div className="coin-insight">
          <span className="coin-ic">🤔</span>
          <p>Approach này O(log n) — tốt hơn O(√n). Nhưng vẫn còn loop. Câu hỏi: <strong>có thể tính thẳng một phát không?</strong></p>
        </div>
      </div>
      <div className="coin-code-wrap">
        <div className="coin-code-bar">
          <span className="coin-code-lang">python</span>
          <span className="coin-code-cx cx--log">O(log n)</span>
        </div>
        <pre className="pcard-code"><code>{binaryCode}</code></pre>
      </div>
      <div className="coin-verdict coin-verdict--ok">
        Tốt hơn Approach 1 — nhưng vẫn còn vòng lặp. Không phải best solution.
      </div>
    </div>
  )
}

function MathPanel({ n, k }) {
  const disc = 1 + 8 * n
  const sqrtVal = Math.sqrt(disc)
  const raw = (sqrtVal - 1) / 2

  return (
    <div className="coin-panel">
      <div className="coin-math-journey">
        <p className="coin-math-intro">
          Quay lại bất đẳng thức gốc và giải nó hoàn toàn bằng toán:
        </p>

        <div className="coin-math-steps">
          <div className="coin-math-step">
            <span className="coin-math-n">1</span>
            <div className="coin-math-content">
              <code>k(k+1)/2 ≤ n</code>
              <span className="coin-math-note">— điều kiện để k rows có thể hoàn thành</span>
            </div>
          </div>
          <div className="coin-math-step">
            <span className="coin-math-n">2</span>
            <div className="coin-math-content">
              <code>k² + k ≤ 2n</code>
              <span className="coin-math-note">— nhân 2 vào hai vế</span>
            </div>
          </div>
          <div className="coin-math-step">
            <span className="coin-math-n">3</span>
            <div className="coin-math-content">
              <code>k² + k − 2n ≤ 0</code>
              <span className="coin-math-note">— đưa về dạng phương trình bậc 2</span>
            </div>
          </div>
          <div className="coin-math-step">
            <span className="coin-math-n">4</span>
            <div className="coin-math-content">
              <span>Dùng công thức nghiệm bậc 2 với a=1, b=1, c=−2n:</span>
            </div>
          </div>
        </div>

        <div className="coin-formula-box">
          <span className="coin-formula-label">Quadratic Formula</span>
          <div className="coin-formula">k = (−1 ± √(1 + 8n)) / 2</div>
        </div>

        <div className="coin-math-steps">
          <div className="coin-math-step">
            <span className="coin-math-n">5</span>
            <div className="coin-math-content">
              <span>Vì k &gt; 0, chỉ lấy nghiệm dương:</span>
              <code>k = (−1 + √(1 + 8n)) / 2</code>
            </div>
          </div>
          <div className="coin-math-step">
            <span className="coin-math-n">6</span>
            <div className="coin-math-content">
              <span>Floor xuống vì cần số nguyên:</span>
              <code>k = ⌊ (√(1+8n) − 1) / 2 ⌋</code>
            </div>
          </div>
        </div>

        <div className="coin-live-calc">
          <div className="coin-live-label">Live với n = {n}:</div>
          <div className="coin-live-steps">
            <div className="coin-live-line">⌊ (√(1 + 8×{n}) − 1) / 2 ⌋</div>
            <div className="coin-live-line">= ⌊ (√{disc} − 1) / 2 ⌋</div>
            <div className="coin-live-line">= ⌊ ({sqrtVal.toFixed(4)} − 1) / 2 ⌋</div>
            <div className="coin-live-line">= ⌊ {raw.toFixed(4)} ⌋</div>
            <div className="coin-live-result">= <strong>{k}</strong></div>
          </div>
        </div>
      </div>

      <div className="coin-code-wrap">
        <div className="coin-code-bar">
          <span className="coin-code-lang">python</span>
          <span className="coin-code-cx cx--o1">O(1) ✦ optimal</span>
        </div>
        <pre className="pcard-code"><code>{mathCode}</code></pre>
      </div>
      <div className="coin-verdict coin-verdict--best">
        Không loop. Tính thẳng một phát. O(1) time và space — đây là best solution.
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArrangeCoins() {
  const navigate = useNavigate()
  const [n, setN] = useState(8)
  const [approach, setApproach] = useState('math')

  const k = Math.floor((Math.sqrt(1 + 8 * n) - 1) / 2)

  return (
    <div className="page coin-page">
      <button className="back-btn" onClick={() => navigate('/dsa')}>← Back</button>

      <h1 className="page-title">Arrange Coins</h1>
      <p className="page-tags">Math · Binary Search · Quadratic Formula · Easy</p>

      <p className="coin-problem-desc">
        Cho <strong>n</strong> coins, xây staircase: row i cần đúng i coins. Row cuối có thể không hoàn thành.
        Return số row hoàn chỉnh.
      </p>

      {/* ── Staircase simulator ── */}
      <div className="coin-sim">
        <div className="coin-sim-top">
          <div className="coin-sim-info">
            <span className="coin-sim-n">n = <strong>{n}</strong></span>
            <span className="coin-sim-sep">→</span>
            <span className="coin-sim-k"><strong>{k}</strong> complete rows</span>
            <span className="coin-sim-used">
              ({k*(k+1)/2}/{n} coins used{n - k*(k+1)/2 > 0 ? `, ${n - k*(k+1)/2} leftover` : ''})
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={55}
            value={n}
            onChange={e => setN(+e.target.value)}
            className="coin-slider"
          />
        </div>
        <Staircase n={n} />
      </div>

      {/* ── Approach tabs ── */}
      <div className="coin-section-label">Quá trình phân tích — 3 approaches</div>

      <div className="coin-tabs">
        {[
          { k: 'brute',  label: 'Approach 1', sub: 'Brute Force',    cx: 'O(√n)' },
          { k: 'binary', label: 'Approach 2', sub: 'Binary Search',  cx: 'O(log n)' },
          { k: 'math',   label: 'Approach 3', sub: 'Math  ✦ final',  cx: 'O(1)' },
        ].map(({ k: key, label, sub, cx }) => (
          <button
            key={key}
            className={`coin-tab ${approach === key ? 'coin-tab--on' : ''}`}
            onClick={() => setApproach(key)}
          >
            <div className="coin-tab-top">
              <span className="coin-tab-label">{label}</span>
              <span className={`coin-tab-cx ${key === 'math' ? 'cx--o1' : key === 'binary' ? 'cx--log' : 'cx--sqrt'}`}>{cx}</span>
            </div>
            <span className="coin-tab-sub">{sub}</span>
          </button>
        ))}
      </div>

      {approach === 'brute'  && <BrutePanel />}
      {approach === 'binary' && <BinaryPanel />}
      {approach === 'math'   && <MathPanel n={n} k={k} />}

      {/* ── Test cases ── */}
      <div className="coin-section-label" style={{ marginTop: 24 }}>Test Cases</div>
      <table className="md-table">
        <thead>
          <tr>
            <th className="md-th">n</th>
            <th className="md-th">expected</th>
            <th className="md-th">⌊(√(8n+1)−1)/2⌋</th>
            <th className="md-th">pass?</th>
          </tr>
        </thead>
        <tbody>
          {[
            [0,   0],
            [1,   1],
            [3,   2],
            [5,   2],
            [8,   3],
            [10,  4],
            [15,  5],
            [100, 13],
          ].map(([input, expected]) => {
            const result = Math.floor((Math.sqrt(1 + 8 * input) - 1) / 2)
            const pass = result === expected
            return (
              <tr key={input}>
                <td className="md-td">{input}</td>
                <td className="md-td">{expected}</td>
                <td className="md-td" style={{ fontFamily: 'monospace' }}>{result}</td>
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
