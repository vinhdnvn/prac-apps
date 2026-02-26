import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Section content ──────────────────────────────────────────────────────────

const sec1 = `
JWT (**JSON Web Token**) là định dạng chuẩn để truyền tải thông tin giữa hai bên một cách an toàn.

> **Lưu ý quan trọng:** "An toàn" ở đây đến từ việc token được **signed** (ký), chứ **không phải được encrypt** (mã hóa). Đây là điểm dễ nhầm nhất về JWT.

---

### 3 phần của một JWT

Một JWT luôn có đúng 3 phần, ngăn cách nhau bởi dấu \`.\`:

\`\`\`
eyJhbGciOiJIUzI1NiJ9 . eyJ1c2VySWQiOjEyM30 . SflKxwRJSMeKKF2QT4fw
      HEADER                   PAYLOAD              SIGNATURE
\`\`\`

**Header** — nhận dạng token:
\`\`\`json
{
  "typ": "JWT",
  "alg": "HS256"
}
\`\`\`

**Payload** — data muốn truyền đi (userId, role, email...):
\`\`\`json
{
  "userId": 123,
  "role": "admin",
  "email": "user@example.com",
  "exp": 1718000000
}
\`\`\`

> ⚠ Payload chỉ được **Base64 encode** để truyền qua HTTP — không được encrypt. Bất kỳ ai có token đều **đọc được payload**. Đừng bao giờ đặt password hay dữ liệu nhạy cảm ở đây.

**Signature** — chữ ký niêm phong, đây là core của JWT:
\`\`\`
HMACSHA256(
  base64(header) + "." + base64(payload),
  SECRET_KEY
)
\`\`\`

Signature được tạo bằng cách hash **Header + Payload** cùng với **secret key** trên server. Ai có token cũng đọc được payload — nhưng **không thể giả mạo** vì không biết secret key để tạo lại signature hợp lệ.

---

### "Self-contained" nghĩa thực sự là gì?

Token chứa đủ: **thông tin user** + **quyền hạn** + **chữ ký xác thực**. Server đọc token là biết ngay — **không cần truy vấn database** để tra xem người này là ai.
`

const sec2 = `
Nhiều người nghĩ "stateless" có nghĩa là hệ thống không lưu trữ bất kỳ dữ liệu gì. Đây là hiểu lầm lớn.

**Stateless** chỉ ám chỉ việc quản lý **phiên đăng nhập (session)** — không phải toàn bộ hệ thống.

---

### So sánh bằng ví dụ thực tế

**Mô hình Stateful — session truyền thống:**

> Ra đường đọc số CMND cho cảnh sát. Cảnh sát gọi về trụ sở tra cứu, đợi phản hồi rồi mới xác minh.
>
> → An toàn, real-time. Nhưng nếu có **1 triệu người** thì trụ sở quá tải.

**Mô hình Stateless — dùng JWT:**

> Mang theo CCCD có chip. Cảnh sát chỉ cần **quét chip xác thực ngay tại chỗ** — không cần gọi về đâu hết.
>
> → Nhanh, không phụ thuộc trung tâm. Server chỉ cần biết **secret key** để xác thực.

---

| | Stateful (Session) | Stateless (JWT) |
|---|---|---|
| Lưu session | Server lưu trong DB/RAM | Không lưu gì |
| Xác thực | Tra DB mỗi request | Verify signature tại chỗ |
| Scale | Khó — phải sync session | Dễ — mọi server đều verify được |
| Thu hồi token | Xóa session là xong | Phức tạp — phải dùng blacklist |
`

const sec3 = `
\`\`\`
1. ISSUANCE — Phát hành token
   ┌─────────────────────────────────────────────────────────┐
   │  Client gửi:  POST /login  { username, password }       │
   │                      ↓                                  │
   │  Server: kiểm tra DB → đúng → tạo JWT                  │
   │          sign(header + payload, SECRET_KEY)             │
   │                      ↓                                  │
   │  Server trả về:  { access_token: "eyJ..." }             │
   └─────────────────────────────────────────────────────────┘

2. VALIDATION — Xác thực mỗi request
   ┌─────────────────────────────────────────────────────────┐
   │  Client gửi:  GET /profile                              │
   │               Authorization: Bearer eyJ...              │
   │                      ↓                                  │
   │  Server: tách ra Header + Payload + Signature           │
   │          tính lại: sign(header + payload, SECRET_KEY)   │
   │          so sánh → khớp → đọc payload → userId = 123   │
   │                      ↓                                  │
   │  Cho phép tiếp tục, không cần query DB                  │
   └─────────────────────────────────────────────────────────┘

3. EXPIRATION — Hết hạn
   ┌─────────────────────────────────────────────────────────┐
   │  Payload có field:  "exp": 1718000000  (Unix timestamp) │
   │                      ↓                                  │
   │  Server check exp mỗi lần validate                      │
   │  Token hết hạn → 401 Unauthorized                       │
   │  Client phải đăng nhập lại hoặc dùng refresh token      │
   └─────────────────────────────────────────────────────────┘
\`\`\`
`

// ─── Token Visual ─────────────────────────────────────────────────────────────

function TokenVisual() {
  const [active, setActive] = useState(null)

  const parts = [
    {
      id: 'header',
      label: 'HEADER',
      token: 'eyJhbGciOiJIUzI1NiJ9',
      color: 'jwt-part--header',
      dot: 'jwt-dot--header',
      title: 'Header',
      desc: 'Loại token + thuật toán ký',
      decoded: '{\n  "typ": "JWT",\n  "alg": "HS256"\n}',
    },
    {
      id: 'payload',
      label: 'PAYLOAD',
      token: 'eyJ1c2VySWQiOjEyM30',
      color: 'jwt-part--payload',
      dot: 'jwt-dot--payload',
      title: 'Payload',
      desc: 'Data người dùng — Base64 encoded, không encrypted',
      decoded: '{\n  "userId": 123,\n  "role": "admin",\n  "exp": 1718000000\n}',
    },
    {
      id: 'sig',
      label: 'SIGNATURE',
      token: 'SflKxwRJSMeKKF2QT4fw',
      color: 'jwt-part--sig',
      dot: 'jwt-dot--sig',
      title: 'Signature',
      desc: 'HMAC(header + payload, SECRET_KEY) — không thể giả mạo',
      decoded: 'HMACSHA256(\n  base64(header) + "." + base64(payload),\n  SERVER_SECRET_KEY\n)',
    },
  ]

  return (
    <div className="jwt-visual">
      {/* Token string */}
      <div className="jwt-token-row">
        {parts.map((p, i) => (
          <span key={p.id}>
            <button
              className={`jwt-token-part ${p.color} ${active === p.id ? 'jwt-part--active' : ''}`}
              onClick={() => setActive(active === p.id ? null : p.id)}
            >
              {p.token}
            </button>
            {i < parts.length - 1 && <span className="jwt-dot">.</span>}
          </span>
        ))}
      </div>

      {/* Labels */}
      <div className="jwt-labels-row">
        {parts.map(p => (
          <div key={p.id} className="jwt-label-col">
            <span className={`jwt-label-dot ${p.dot}`} />
            <span className="jwt-label-text">{p.label}</span>
          </div>
        ))}
      </div>

      {/* Decode panel */}
      {active && (() => {
        const p = parts.find(x => x.id === active)
        return (
          <div className={`jwt-decode-panel ${p.color}-panel`}>
            <div className="jwt-decode-header">
              <span className={`jwt-decode-badge ${p.color}`}>{p.label}</span>
              <span className="jwt-decode-desc">{p.desc}</span>
            </div>
            <pre className="jwt-decode-pre">{p.decoded}</pre>
            {p.id === 'payload' && (
              <div className="jwt-decode-warn">
                ⚠ Base64 decode bằng bất kỳ tool nào đều đọc được nội dung này
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

const mdComponents = {
  h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
  p: ({ children }) => <p className="md-p">{children}</p>,
  code: ({ className, children }) =>
    className
      ? <code>{children}</code>
      : <code className="md-code-inline">{children}</code>,
  pre: ({ children }) => <pre className="md-pre">{children}</pre>,
  table: ({ children }) => <table className="md-table">{children}</table>,
  th: ({ children }) => <th className="md-th">{children}</th>,
  td: ({ children }) => <td className="md-td">{children}</td>,
  strong: ({ children }) => <strong className="md-strong">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
  hr: () => <hr className="md-hr" />,
  li: ({ children }) => <li className="md-li">{children}</li>,
}

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

export default function JWT() {
  const navigate = useNavigate()

  return (
    <div className="page jwt-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <h1 className="page-title">JWT</h1>
      <p className="page-tags">JSON Web Token · Auth · Stateless · Signature</p>

      <div className="jwt-sections">

        {/* Section 1 */}
        <Section num="01" title="JWT là gì?" badge="core concept">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec1.split('### 3 phần của một JWT')[0]}
          </ReactMarkdown>

          <h3 className="md-h3" style={{ marginTop: 20 }}>3 phần của một JWT</h3>
          <p className="md-p" style={{ marginBottom: 16 }}>
            Nhấn vào từng phần để xem nội dung được decode:
          </p>
          <TokenVisual />

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec1.split('### 3 phần của một JWT')[1]?.split('### "Self-contained"')[0] ?? ''}
          </ReactMarkdown>

          <div className="jwt-selfcontained">
            <div className="jwt-sc-label">"self-contained" nghĩa thực sự</div>
            <div className="jwt-sc-row">
              <div className="jwt-sc-item">
                <span className="jwt-sc-icon">👤</span>
                <span className="jwt-sc-text">Thông tin user</span>
              </div>
              <span className="jwt-sc-plus">+</span>
              <div className="jwt-sc-item">
                <span className="jwt-sc-icon">🔑</span>
                <span className="jwt-sc-text">Quyền hạn</span>
              </div>
              <span className="jwt-sc-plus">+</span>
              <div className="jwt-sc-item">
                <span className="jwt-sc-icon">✍</span>
                <span className="jwt-sc-text">Chữ ký xác thực</span>
              </div>
              <span className="jwt-sc-arrow">→</span>
              <div className="jwt-sc-result">
                Server không cần query DB
              </div>
            </div>
          </div>
        </Section>

        {/* Section 2 */}
        <Section num="02" title="Stateless — khái niệm dễ hiểu sai" badge="common mistake">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec2}
          </ReactMarkdown>
        </Section>

        {/* Section 3 */}
        <Section num="03" title="Vòng đời JWT" badge="lifecycle">
          <div className="jwt-lifecycle-intro">
            <p className="md-p">3 giai đoạn mỗi JWT phải đi qua:</p>
            <div className="jwt-phase-tags">
              <span className="jwt-phase-tag jwt-phase-tag--issue">Issuance</span>
              <span className="jwt-phase-arrow">→</span>
              <span className="jwt-phase-tag jwt-phase-tag--validate">Validation</span>
              <span className="jwt-phase-arrow">→</span>
              <span className="jwt-phase-tag jwt-phase-tag--expire">Expiration</span>
            </div>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec3}
          </ReactMarkdown>
        </Section>

      </div>
    </div>
  )
}
