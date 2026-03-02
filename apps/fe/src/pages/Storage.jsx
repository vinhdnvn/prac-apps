import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Content ──────────────────────────────────────────────────────────────────

const secCookies = `
**Cookies** được sinh ra để giải quyết một vấn đề cốt lõi: HTTP là giao thức **stateless** — server không nhớ bạn là ai giữa các request. Cookies là cơ chế đầu tiên và duy nhất cho phép **server đặt dữ liệu vào trình duyệt** và tự động nhận lại ở mọi request sau.

Mỗi lần trình duyệt gửi request đến cùng domain, toàn bộ cookie sẽ được **đính kèm tự động vào Header** — bạn không cần viết một dòng JavaScript nào.

### Các thuộc tính quan trọng

**Thời gian sống:**
- Không đặt \`expires\`/\`max-age\` → **Session Cookie**: biến mất khi đóng trình duyệt
- Đặt \`max-age=3600\` → sống thêm đúng 3600 giây, lưu xuống đĩa cứng

**Bảo mật:**
- \`HttpOnly\` → JavaScript **không thể đọc** cookie này. Đây là lá chắn chống XSS mạnh nhất
- \`Secure\` → chỉ gửi qua **HTTPS**, không bao giờ đi qua HTTP thường
- \`SameSite=Strict\` → không gửi cookie khi điều hướng từ domain khác (chống CSRF)

\`\`\`http
Set-Cookie: token=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
\`\`\`

> ⚠ Vì cookie tự động gửi kèm mọi request, nó có thể bị khai thác qua **CSRF** nếu không dùng \`SameSite\`.
`

const secLocalStorage = `
**Local Storage** ra đời cùng HTML5 để giải quyết giới hạn 4KB của cookie. Nó là một kho lưu trữ **thuần client-side** — server không bao giờ tự động nhận được dữ liệu này.

Dữ liệu tồn tại **vĩnh viễn** trên máy người dùng cho đến khi bị xóa thủ công hoặc qua code. Không có cơ chế hết hạn tự động.

\`\`\`js
// Lưu
localStorage.setItem('theme', 'dark')
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Vinh' }))

// Đọc
const theme = localStorage.getItem('theme')          // 'dark'
const user  = JSON.parse(localStorage.getItem('user'))

// Xóa
localStorage.removeItem('theme')
localStorage.clear()  // xóa hết
\`\`\`

> ⚠ Local Storage **hoàn toàn bị lộ** nếu XSS xảy ra — script độc hại đọc được tất cả. Không bao giờ lưu token quan trọng ở đây.
`

const secSessionStorage = `
**Session Storage** có API giống hệt Local Storage, nhưng có vòng đời ngắn hơn nhiều: dữ liệu **biến mất khi đóng tab**. Mỗi tab là một "phiên" (session) riêng biệt — dữ liệu không chia sẻ giữa các tab, kể cả cùng domain.

\`\`\`js
// Lưu
sessionStorage.setItem('step', '2')
sessionStorage.setItem('formDraft', JSON.stringify({ name: 'Vinh' }))

// Đọc
const step = sessionStorage.getItem('step')  // '2'

// Xóa theo tab — không cần xóa thủ công, đóng tab là mất
\`\`\`

**Use-case điển hình:**
- Giữ trạng thái multi-step form khi người dùng F5 lại trang
- Lưu vị trí cuộn trang trong tab hiện tại
- Dữ liệu wizard (bước 1 → 2 → 3) mà không muốn persist
`

const secSecurity = `
### Khi nào dùng cái nào?

**JWT / Auth Token → Cookie HttpOnly + Secure**

Đây là lựa chọn an toàn nhất. JavaScript không đọc được → XSS không ăn. \`SameSite=Strict\` + CSRF token giải quyết nốt phần còn lại.

**Cấu hình giao diện (theme, language) → Local Storage**

Dữ liệu không nhạy cảm, cần persist lâu dài. Hoàn toàn phù hợp.

**Trạng thái tạm thời (wizard, form draft) → Session Storage**

Cần trong phiên làm việc hiện tại, không cần khi người dùng mở tab mới.

---

> ❌ **Không bao giờ:** lưu password, token có quyền cao, thông tin tài chính vào Local/Session Storage. Một lỗi XSS duy nhất là đủ để hacker hút sạch.
`

// ─── Compare Table ─────────────────────────────────────────────────────────────

const compareRows = [
  { attr: 'Dung lượng',     cookie: '~4KB',              local: '~5–10MB',          session: '~5–10MB' },
  { attr: 'Thời gian sống', cookie: 'Tùy đặt / session', local: 'Vĩnh viễn',        session: 'Đóng tab → mất' },
  { attr: 'Truy cập',       cookie: 'Client + Server',   local: 'Client only',      session: 'Client only' },
  { attr: 'Gửi kèm HTTP',   cookie: 'Tự động ✅',        local: 'Không ❌',          session: 'Không ❌' },
  { attr: 'HttpOnly',       cookie: 'Có ✅',             local: 'Không có ❌',       session: 'Không có ❌' },
  { attr: 'Chia sẻ tab',    cookie: 'Có (same domain)',  local: 'Có (same domain)',  session: 'Không — mỗi tab riêng' },
  { attr: 'Rủi ro XSS',    cookie: 'Thấp (HttpOnly)',   local: 'Cao ⚠',            session: 'Cao ⚠' },
  { attr: 'Rủi ro CSRF',   cookie: 'Có (cần SameSite)', local: 'Không',            session: 'Không' },
]

function CompareTable() {
  return (
    <div className="str-table-wrap">
      <table className="str-table">
        <thead>
          <tr>
            <th className="str-th str-th--attr">Thuộc tính</th>
            <th className="str-th str-th--cookie">🍪 Cookies</th>
            <th className="str-th str-th--local">💾 Local Storage</th>
            <th className="str-th str-th--session">⏱ Session Storage</th>
          </tr>
        </thead>
        <tbody>
          {compareRows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'str-tr-even' : 'str-tr-odd'}>
              <td className="str-td str-td--attr">{row.attr}</td>
              <td className="str-td">{row.cookie}</td>
              <td className="str-td">{row.local}</td>
              <td className="str-td">{row.session}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Simulator ────────────────────────────────────────────────────────────────

const STORAGE_TYPES = [
  { key: 'local',   label: 'Local Storage',   icon: '💾', color: 'local',   note: 'Tồn tại vĩnh viễn, thử đóng tab rồi mở lại!' },
  { key: 'session', label: 'Session Storage', icon: '⏱', color: 'session', note: 'Đóng tab là mất, mỗi tab là riêng biệt.' },
  { key: 'cookie',  label: 'Cookie',          icon: '🍪', color: 'cookie',  note: 'Gửi kèm mọi request HTTP. Có thể đặt HttpOnly từ server.' },
]

function StorageSimulator() {
  const [activeTab, setActiveTab] = useState('local')
  const [key, setKey]   = useState('')
  const [val, setVal]   = useState('')
  const [items, setItems] = useState({ local: [], session: [], cookie: [] })
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'ok') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2000)
  }

  const getStorage = (type) => {
    if (type === 'local')   return window.localStorage
    if (type === 'session') return window.sessionStorage
    return null // cookie handled separately
  }

  const readAll = (type) => {
    if (type === 'cookie') {
      return document.cookie
        .split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith('sim_'))
        .map(c => {
          const [k, ...rest] = c.split('=')
          return { k: k.slice(4), v: rest.join('=') }
        })
    }
    const s = getStorage(type)
    return Object.keys(s)
      .filter(k => k.startsWith('sim_'))
      .map(k => ({ k: k.slice(4), v: s.getItem(k) }))
  }

  const refresh = (type) => {
    setItems(prev => ({ ...prev, [type]: readAll(type) }))
  }

  const handleSet = () => {
    if (!key.trim() || !val.trim()) { flash('Nhập cả key và value nhé!', 'err'); return }
    if (activeTab === 'cookie') {
      document.cookie = `sim_${key}=${val}; path=/; max-age=3600`
    } else {
      getStorage(activeTab).setItem(`sim_${key}`, val)
    }
    flash(`Đã lưu "${key}"`)
    setKey(''); setVal('')
    refresh(activeTab)
  }

  const handleDelete = (k) => {
    if (activeTab === 'cookie') {
      document.cookie = `sim_${k}=; path=/; max-age=0`
    } else {
      getStorage(activeTab).removeItem(`sim_${k}`)
    }
    flash(`Đã xóa "${k}"`)
    refresh(activeTab)
  }

  const handleClear = () => {
    if (activeTab === 'cookie') {
      readAll('cookie').forEach(({ k }) => {
        document.cookie = `sim_${k}=; path=/; max-age=0`
      })
    } else {
      const s = getStorage(activeTab)
      Object.keys(s).filter(k => k.startsWith('sim_')).forEach(k => s.removeItem(k))
    }
    flash('Đã xóa hết')
    refresh(activeTab)
  }

  const switchTab = (t) => {
    setActiveTab(t)
    setItems(prev => ({ ...prev, [t]: readAll(t) }))
    setKey(''); setVal('')
  }

  const current = STORAGE_TYPES.find(s => s.key === activeTab)
  const currentItems = items[activeTab]

  return (
    <div className="str-sim">
      {/* Tabs */}
      <div className="str-sim-tabs">
        {STORAGE_TYPES.map(s => (
          <button
            key={s.key}
            className={`str-sim-tab str-sim-tab--${s.color} ${activeTab === s.key ? 'str-sim-tab--active' : ''}`}
            onClick={() => switchTab(s.key)}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Note */}
      <div className={`str-sim-note str-sim-note--${current.color}`}>
        {current.note}
      </div>

      {/* Input row */}
      <div className="str-sim-form">
        <input
          className="str-sim-input"
          placeholder="key"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSet()}
        />
        <input
          className="str-sim-input"
          placeholder="value"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSet()}
        />
        <button className={`str-sim-btn str-sim-btn--set str-sim-btn--${current.color}`} onClick={handleSet}>
          setItem()
        </button>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`str-sim-flash ${msg.type === 'err' ? 'str-sim-flash--err' : 'str-sim-flash--ok'}`}>
          {msg.text}
        </div>
      )}

      {/* Items */}
      <div className="str-sim-store">
        <div className="str-sim-store-head">
          <span className="str-sim-store-title">{current.icon} {current.label}</span>
          <span className="str-sim-count">{currentItems.length} item{currentItems.length !== 1 ? 's' : ''}</span>
          {currentItems.length > 0 && (
            <button className="str-sim-clear" onClick={handleClear}>clear all</button>
          )}
        </div>

        {currentItems.length === 0 ? (
          <div className="str-sim-empty">Chưa có gì — thử setItem() xem!</div>
        ) : (
          <div className="str-sim-list">
            {currentItems.map(({ k, v }) => (
              <div key={k} className="str-sim-item">
                <span className="str-sim-item-key">{k}</span>
                <span className="str-sim-item-eq">=</span>
                <span className="str-sim-item-val">{v}</span>
                <button className="str-sim-del" onClick={() => handleDelete(k)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code preview */}
      <div className="str-sim-code">
        <span className="str-sim-code-label">code tương đương</span>
        <pre className="str-sim-code-pre">{activeTab === 'cookie'
          ? `// Lưu (từ client, không có HttpOnly)\ndocument.cookie = "key=value; max-age=3600"\n\n// Đọc\ndocument.cookie  // chuỗi "key=value; key2=value2"`
          : `${activeTab}Storage.setItem("key", "value")\n${activeTab}Storage.getItem("key")   // "value"\n${activeTab}Storage.removeItem("key")\n${activeTab}Storage.clear()`
        }</pre>
      </div>
    </div>
  )
}

// ─── mdComponents ──────────────────────────────────────────────────────────────

const mdComponents = {
  h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
  p: ({ children }) => <p className="md-p">{children}</p>,
  code: ({ className, children }) =>
    className
      ? <code>{children}</code>
      : <code className="md-code-inline">{children}</code>,
  pre: ({ children }) => <pre className="md-pre">{children}</pre>,
  strong: ({ children }) => <strong className="md-strong">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
  hr: () => <hr className="md-hr" />,
  li: ({ children }) => <li className="md-li">{children}</li>,
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ num, title, badge, children }) {
  return (
    <div className="jwt-section">
      <div className="jwt-section-head">
        <span className="jwt-section-num">{num}</span>
        <h2 className="jwt-section-title">{title}</h2>
        {badge && <span className="jwt-badge">{badge}</span>}
      </div>
      <div className="jwt-section-body">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Storage() {
  const navigate = useNavigate()

  return (
    <div className="page jwt-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <h1 className="page-title">Browser Storage</h1>
      <p className="page-tags">Cookies · Local Storage · Session Storage · Security</p>

      <div className="jwt-sections">

        {/* Overview */}
        <div className="str-overview">
          <div className="str-overview-card str-overview-card--cookie">
            <div className="str-overview-icon">🍪</div>
            <div className="str-overview-name">Cookies</div>
            <div className="str-overview-cap">~4KB</div>
            <div className="str-overview-life">Tùy đặt</div>
            <div className="str-overview-tag">Client + Server</div>
          </div>
          <div className="str-overview-card str-overview-card--local">
            <div className="str-overview-icon">💾</div>
            <div className="str-overview-name">Local Storage</div>
            <div className="str-overview-cap">~10MB</div>
            <div className="str-overview-life">Vĩnh viễn</div>
            <div className="str-overview-tag">Client only</div>
          </div>
          <div className="str-overview-card str-overview-card--session">
            <div className="str-overview-icon">⏱</div>
            <div className="str-overview-name">Session Storage</div>
            <div className="str-overview-cap">~10MB</div>
            <div className="str-overview-life">Đóng tab → mất</div>
            <div className="str-overview-tag">Client only</div>
          </div>
        </div>

        {/* Section 1 */}
        <Section num="01" title="Cookies" badge="client + server">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secCookies}
          </ReactMarkdown>
        </Section>

        {/* Section 2 */}
        <Section num="02" title="Local Storage" badge="persistent">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secLocalStorage}
          </ReactMarkdown>
        </Section>

        {/* Section 3 */}
        <Section num="03" title="Session Storage" badge="tab-scoped">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secSessionStorage}
          </ReactMarkdown>
        </Section>

        {/* Section 4 — Compare table */}
        <Section num="04" title="Bảng so sánh" badge="quick reference">
          <CompareTable />
        </Section>

        {/* Section 5 — Security */}
        <Section num="05" title="Khi nào dùng cái nào?" badge="security">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secSecurity}
          </ReactMarkdown>

          {/* Recommendation pills */}
          <div className="str-reco">
            <div className="str-reco-item">
              <span className="str-reco-usecase">Auth Token / JWT</span>
              <span className="str-reco-arrow">→</span>
              <span className="str-reco-choice str-reco-choice--cookie">🍪 Cookie HttpOnly + Secure</span>
            </div>
            <div className="str-reco-item">
              <span className="str-reco-usecase">Theme, Language, UI config</span>
              <span className="str-reco-arrow">→</span>
              <span className="str-reco-choice str-reco-choice--local">💾 Local Storage</span>
            </div>
            <div className="str-reco-item">
              <span className="str-reco-usecase">Form draft, Wizard step, Temp UI</span>
              <span className="str-reco-arrow">→</span>
              <span className="str-reco-choice str-reco-choice--session">⏱ Session Storage</span>
            </div>
          </div>
        </Section>

        {/* Section 6 — Simulator */}
        <Section num="06" title="Simulator — thử live trên trình duyệt" badge="interactive">
          <p className="md-p" style={{ marginBottom: 16 }}>
            Dữ liệu được lưu thật vào trình duyệt của bạn. Chuyển tab, F5 lại, hoặc đóng tab để quan sát sự khác biệt.
          </p>
          <StorageSimulator />
        </Section>

      </div>
    </div>
  )
}
