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

// ─── Part 2 content ───────────────────────────────────────────────────────────

const sec9a = `
Khi hệ thống phình to và bị băm nhỏ thành hàng chục service khác nhau, bài toán đau đầu nhất xuất hiện: **Ai sẽ chịu trách nhiệm đọc và kiểm tra chữ ký JWT?**

Trên bàn cân thiết kế sẽ xuất hiện hai trường phái đối lập nhau:
`

const sec9b_centralized = `
### Mô hình 1 — Xác thực tập trung tại cổng (Centralized)

API Gateway đóng vai trò **trạm gác an ninh duy nhất** của toàn bộ hệ thống. Khi request chứa JWT đến cổng, Gateway đích thân giải mã, kiểm tra chữ ký và thời hạn. Nếu hợp lệ, Gateway bóc lấy thông tin từ Payload và nhét vào HTTP Header thông thường (ví dụ: \`X-User-Id: 123\`) rồi đẩy sâu vào các Microservice bên trong.

✅ **Ưu điểm:** Các Microservice bên trong rũ bỏ hoàn toàn gánh nặng tính toán mật mã. Secret Key chỉ cần cất ở một chỗ duy nhất.

❌ **Điểm yếu chí mạng:** "Niềm tin ngây thơ vào mạng nội bộ". Hacker chui được vào LAN chỉ cần tự tạo request kẹp header \`X-User-Id: 1\` bắn thẳng vào Service Thanh toán — bỏ qua hoàn toàn Gateway. Service ngây thơ tin tuyệt đối và thực hiện lệnh chuyển tiền.
`

const sec9c_zerotrust = `
### Mô hình 2 — Xác thực phân tán (Zero Trust)

Để vá lỗ hổng trên, áp dụng triết lý **"Không tin bất kỳ ai"**. API Gateway bị tước quyền kiểm tra JWT, chỉ làm đúng nhiệm vụ dẫn đường (Routing). Chiếc JWT nguyên bản được đẩy thẳng xuống các Microservice — bất kỳ service nào nhận request cũng **tự mình dùng Khóa toán học để kiểm tra lại chữ ký**.

Dù hacker có chui vào mạng nội bộ, hắn cũng không thể tạo JWT giả mạo vì không có Khóa để ký.

> **Nhưng mô hình Zero Trust đẻ ra một nỗi đau khác:** Làm sao phân phát Khóa bảo mật cho 50 Microservice cùng lúc một cách an toàn?
`

const sec9d_jwks = `
### Giải pháp: JWKS và Nghệ thuật Caching

Không thể dùng một Symmetric Key (HS256) copy cho 50 services — lộ một cái là mất tất cả. Thay vào đó, dùng **Cặp khóa Bất đối xứng (RS256)**:

- **Auth Server** giữ **Private Key** để tạo và ký JWT
- **50 Microservice** nhận **Public Key** để tự xác thực

Cơ chế này vận hành tự động qua **JWKS (JSON Web Key Set)**:

1. Auth Server mở API công khai \`/.well-known/jwks.json\` chứa danh sách Public Key hợp lệ
2. Mỗi JWT được gắn mã định danh \`kid\` (Key ID) trên phần Header
3. Microservice đọc \`kid\` và biết phải dùng Public Key nào để verify

**Về Caching:** Microservice tải danh sách JWKS **một lần lúc khởi động và lưu vào RAM**. Mọi xác thực sau đó diễn ra tức thì. Chỉ khi có token mang \`kid\` mới lạ (do Auth Server vừa đổi khóa định kỳ), Microservice mới chủ động gọi mạng để tải JWKS mới về cập nhật.
`

const sec10 = `
Giữ được Zero Trust là thành tựu lớn, nhưng nó mang tác dụng phụ khủng khiếp. Vì muốn các service không phải gọi chéo nhau hay chọc vào Database để hỏi quyền hạn, lập trình viên bắt đầu nhét **"cả thế giới"** vào Payload của JWT.

Từ User ID, Email, cho đến một array dài chứa hàng chục Roles và Permissions. Token từ nhẹ nhàng phình to thành **khối dữ liệu nặng 4KB**.

---

### Phép toán mạng lưới đáng sợ

Trang chủ cần gọi song song **20 API requests**.
Mỗi request cõng theo JWT **4KB** trong Header.
→ **80KB băng thông** chỉ để chứng minh người dùng là ai, **trước cả khi một byte dữ liệu nghiệp vụ nào được truyền đi**.

Ở quy mô hàng chục ngàn người dùng truy cập cùng lúc, "Token béo phì" sẽ **bóp nghẹt hoàn toàn băng thông** hệ thống.
`

const sec11a = `
Bài toán: Làm sao để Client bên ngoài Internet **không phải tải cục data 4KB**, nhưng các Microservice bên trong **vẫn nhận được cục 4KB** để xác thực Stateless?

Lời giải nằm ở tuyệt kỹ kiến trúc: **Phantom Token Pattern** (Token Bóng ma).
`

const sec11b = `
### Cách vận hành — tinh tế như một màn ảo thuật

**Bước 1 — Thế giới bên ngoài cầm Opaque Token:**

Khi người dùng đăng nhập, Auth Server vẫn tạo ra chiếc JWT 4KB khổng lồ. Nhưng nó **KHÔNG gửi JWT về cho trình duyệt**. Thay vào đó, nó:

- Cất JWT vào **In-memory Database siêu tốc** (như Redis)
- Chỉ tạo một **chuỗi ngẫu nhiên, vô nghĩa, cực ngắn** (UUID: \`7b9a-4c2f...\`) gửi về Client

Chuỗi này gọi là **Opaque Token**.

**Bước 2 — Cánh cửa ma thuật (API Gateway):**

Client mang UUID siêu nhẹ gửi lên. Gateway lấy UUID làm **Key** chọc vào Redis để "chuộc" lại JWT 4KB nguyên bản (**Value**).

**Bước 3 — Thế giới bên trong hoàn toàn Stateless:**

Gateway đính kèm JWT 4KB vào request và đẩy sâu vào mạng Microservice. Các service dùng JWKS trên RAM để kiểm tra chữ ký một cách độc lập.

---

### Đòn kết liễu cho bài toán Logout hoàn hảo

Bạn còn nhớ sự bất lực khi cố thu hồi JWT chưa hết hạn? Với Phantom Token, bài toán này được giải quyết bằng **một câu lệnh duy nhất**:

Khi người dùng bấm "Logout", Gateway chỉ cần:

\`\`\`
DEL <chuỗi_UUID>
\`\`\`

Bản ghi trong Redis bốc hơi ngay lập tức. Request tiếp theo, dù Client vẫn cầm UUID cũ, Gateway tìm trong Redis trả về \`null\` → chặn đứng bằng **401 Unauthorized**. Phiên đăng xuất tức thì, dứt khoát — không cần quan tâm chiếc JWT 4KB kia bao giờ mới hết hạn.
`

const sec12 = `
Nếu hệ thống rơi vào các kịch bản sau, hãy dũng cảm quay về với **Session truyền thống**:

**Hệ thống Monolith (một server duy nhất):**
RAM server dư sức chứa hàng trăm ngàn Session. Đừng rước sự phức tạp của JWT (Refresh Token, Cookie Security, Caching JWKS) vào dự án chỉ vì "nghe nói nó là trend".

**Hệ thống có quyền hạn thay đổi liên tục:**
Nếu cần tước quyền user và có hiệu lực ngay từng giây, Session làm việc này xuất sắc vì mọi thứ check trực tiếp dưới DB. Với JWT, token đã phát hành thì **không thể sửa Payload**.

**Ứng dụng Tài chính/Ngân hàng lõi (Core Banking):**
Đòi hỏi khả năng kiểm soát trạng thái tuyệt đối, cần quyền "giết" phiên giao dịch ngay lập tức khi phát hiện rủi ro. Mô hình **Stateful Session luôn là ưu tiên số một**.

---

> **Ngoại lệ quan trọng:** Backend Monolith phục vụ **cả Web lẫn Mobile App**? Quản lý cookie trên mobile khá phiền phức và khó chịu. Lúc này, dùng JWT để đồng nhất giao tiếp cho cả Web và Mobile lại là sự đánh đổi hoàn toàn xứng đáng. Use-case này chính là ngoại lệ hoàn hảo để chứng minh kiến trúc không có đúng sai tuyệt đối — chỉ có phù hợp hay không phù hợp với hoàn cảnh.
`

const sec13 = `
JWT không sinh ra để thay thế Session. Nó sinh ra để giải quyết bài toán của **Sự phân tán và Ủy quyền**:

**Hệ thống Microservices quy mô lớn:**
Hàng chục services cần biết "Ai đang gọi tôi" theo mô hình Zero Trust + Phantom Token mà không làm sập Database tập trung.

**Hệ sinh thái SSO (Single Sign-On) và OAuth2/OIDC:**
Khi bạn bấm "Login with Google" vào Spotify, Google cấp cho Spotify một chiếc JWT. Spotify tự mình kiểm tra chữ ký của Google để cho bạn nghe nhạc mà **không cần dùng chung Database với Google**. Đây là sân chơi vô đối của JWT.
`

const sec14 = `
Chúng ta đã đi một chặng đường dài: từ những lầm tưởng ngây thơ về Base64, sự thật về chữ ký toán học, cuộc chiến chống XSS/CSRF trên trình duyệt, cho đến những màn thiết kế kiến trúc hóc búa để phân phát Khóa (JWKS) và thu hồi Token (Phantom Token) trong hệ thống Microservices.

**Bài học lớn nhất đọng lại:**

Trước khi áp dụng JWT vào dự án, hãy tự hỏi:
- Hệ thống của mình có thực sự cần đến sự Stateless không?
- Mình đã sẵn sàng đánh đổi sự đơn giản của Session để lấy khả năng mở rộng (Scale) chưa?

Khi trả lời được những câu hỏi đó một cách thấu đáo, bạn đã không còn là lập trình viên chỉ biết gõ code theo Tutorial. Bạn đã tư duy như một **Kiến trúc sư hệ thống thực thụ**.
`

// ─── Architecture diagrams ─────────────────────────────────────────────────────

const centralizedDiagram = `
┌─────────────────────────────────────────────────────────────────┐
│                 MÔ HÌNH TẬP TRUNG (Centralized)                 │
│                                                                  │
│   Client          API Gateway             Microservices          │
│     │                  │                       │                 │
│     │── JWT ──────────▶│                       │                 │
│     │                  │ verify sig ✓           │                 │
│     │                  │ decode payload         │                 │
│     │                  │── X-User-Id: 123 ─────▶│                 │
│     │                  │                       │ (tin tưởng      │
│     │                  │                       │  header này)    │
│                                                                  │
│   ⚠  Rủi ro: Hacker vào LAN tự forge X-User-Id: 1              │
│      bắn thẳng vào service, bỏ qua hoàn toàn Gateway            │
└─────────────────────────────────────────────────────────────────┘
`

const zeroTrustDiagram = `
┌─────────────────────────────────────────────────────────────────┐
│                  MÔ HÌNH ZERO TRUST (Phân tán)                  │
│                                                                  │
│   Client          API Gateway             Microservices          │
│     │                  │                       │                 │
│     │── JWT ──────────▶│                       │                 │
│     │                  │── JWT (nguyên bản) ──▶│                 │
│     │                  │  (chỉ routing)        │ verify sig      │
│     │                  │                       │ bằng Public Key │
│     │                  │                       │ từ JWKS cache   │
│                                                                  │
│   ✅ Hacker vào LAN không thể forge JWT — không có Private Key  │
│                                                                  │
│   Auth Server ──── /.well-known/jwks.json ────▶ Public Keys     │
│                                │                     │           │
│                                └── tải 1 lần ───────▶│           │
│                                                  RAM Cache       │
│                                               kid:"v1"→Key_v1   │
└─────────────────────────────────────────────────────────────────┘
`

const phantomTokenDiagram = `
┌─────────────────────────────────────────────────────────────────┐
│                    PHANTOM TOKEN PATTERN                         │
│                                                                  │
│  ① Đăng nhập                                                     │
│                                                                  │
│  Client ──POST /login──▶ Auth Server                            │
│                              │ tạo JWT 4KB                      │
│                              │ lưu Redis: key="7b9a" val=JWT    │
│  Client ◀── "7b9a-4c2f" ───  │ (gửi về UUID ngắn gọn)          │
│                                                                  │
│  ② Mỗi lần gọi API                                               │
│                                                                  │
│  Client           API Gateway                Microservice        │
│    │── "7b9a" ──▶│                               │              │
│    │  (nhẹ ~36B)  │── Redis.get("7b9a") ──▶ JWT  │              │
│    │              │◀─ JWT 4KB ──────────────────  │              │
│    │              │── JWT 4KB ───────────────────▶│              │
│    │              │                    verify → process          │
│                                                                  │
│  ③ Logout                                                        │
│                                                                  │
│  Client ──POST /logout──▶ Gateway ── Redis.del("7b9a") ──▶ ✅   │
│                                                                  │
│  Request tiếp theo:                                              │
│  Client ── "7b9a" ──▶ Gateway ── Redis miss ──▶ 401 🚫          │
└─────────────────────────────────────────────────────────────────┘
`

const payloadBloomDiagram = `
┌──────────────────────────────────────────────────────────┐
│               PAYLOAD BLOAT — Tác hại thực tế            │
│                                                          │
│  JWT "khỏe mạnh" (~200 bytes)                            │
│  ┌──────────────────────────────┐                        │
│  │ userId, email, exp           │                        │
│  └──────────────────────────────┘                        │
│                                                          │
│  JWT "béo phì" (~4KB)                                    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ userId, email, exp, roles[], permissions[],      │    │
│  │ orgId, department, featureFlags[], tenantId,     │    │
│  │ preferences{}, lastLogin, deviceInfo{}...        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Trang chủ gọi 20 API song song:                         │
│  20 requests × 4KB JWT = 80KB băng thông                 │
│  → chưa một byte nghiệp vụ nào được truyền!              │
│                                                          │
│  × 10,000 users đồng thời ≈ 800MB/s lãng phí            │
└──────────────────────────────────────────────────────────┘
`

// ─── Interactive diagram ───────────────────────────────────────────────────────

function ArchDiagram({ title, content, badge }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="jwt-arch-diagram">
      <button
        className={`jwt-arch-toggle ${expanded ? 'jwt-arch-toggle--open' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <span className="jwt-arch-toggle-icon">{expanded ? '▼' : '▶'}</span>
        <span className="jwt-arch-toggle-title">{title}</span>
        {badge && <span className="jwt-badge" style={{ marginLeft: 8 }}>{badge}</span>}
      </button>
      {expanded && (
        <pre className="jwt-arch-pre">{content}</pre>
      )}
    </div>
  )
}

// ─── Trade-off card ────────────────────────────────────────────────────────────

function TradeoffCard({ icon, title, items, variant }) {
  return (
    <div className={`jwt-tradeoff-card jwt-tradeoff-card--${variant}`}>
      <div className="jwt-tradeoff-head">
        <span className="jwt-tradeoff-icon">{icon}</span>
        <span className="jwt-tradeoff-title">{title}</span>
      </div>
      <ul className="jwt-tradeoff-list">
        {items.map((item, i) => (
          <li key={i} className="jwt-tradeoff-item">{item}</li>
        ))}
      </ul>
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

        {/* ── PART 2 ── */}

        {/* Section 9 */}
        <Section num="09" title="Xác thực ở đâu: API Gateway hay từng Microservice?" badge="architecture">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec9a}
          </ReactMarkdown>

          <ArchDiagram
            title="Sơ đồ: Mô hình tập trung (Centralized)"
            content={centralizedDiagram}
            badge="⚠ có lỗ hổng"
          />

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec9b_centralized}
          </ReactMarkdown>

          <ArchDiagram
            title="Sơ đồ: Mô hình Zero Trust + JWKS Caching"
            content={zeroTrustDiagram}
            badge="✅ khuyên dùng"
          />

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec9c_zerotrust}
          </ReactMarkdown>

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec9d_jwks}
          </ReactMarkdown>

          {/* RS256 vs HS256 visual */}
          <div className="jwt-key-compare">
            <div className="jwt-key-box jwt-key-box--sym">
              <div className="jwt-key-label">HS256 — Symmetric</div>
              <div className="jwt-key-icon">🔑</div>
              <div className="jwt-key-desc">Một khóa duy nhất — ký và verify</div>
              <div className="jwt-key-warn">Lộ 1 service = lộ tất cả</div>
            </div>
            <div className="jwt-key-arrow">→</div>
            <div className="jwt-key-box jwt-key-box--asym">
              <div className="jwt-key-label">RS256 — Asymmetric</div>
              <div className="jwt-key-icon">🔐</div>
              <div className="jwt-key-row">
                <span className="jwt-key-tag jwt-key-tag--priv">Private Key (Auth Server ký)</span>
                <span className="jwt-key-tag jwt-key-tag--pub">Public Key (Services verify)</span>
              </div>
              <div className="jwt-key-safe">Lộ Public Key không sao cả</div>
            </div>
          </div>
        </Section>

        {/* Section 10 */}
        <Section num="10" title='Nút thắt cổ chai "Payload Bloat" — Token béo phì' badge="performance">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec10}
          </ReactMarkdown>

          <ArchDiagram
            title="Minh họa: Payload Bloat và tác hại thực tế"
            content={payloadBloomDiagram}
            badge="bandwidth killer"
          />
        </Section>

        {/* Section 11 */}
        <Section num="11" title='Tuyệt kỹ cứu rỗi băng thông: "Phantom Token"' badge="pattern">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec11a}
          </ReactMarkdown>

          <ArchDiagram
            title="Sơ đồ kiến trúc: Phantom Token Pattern — toàn bộ flow"
            content={phantomTokenDiagram}
            badge="click để xem"
          />

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec11b}
          </ReactMarkdown>

          {/* Phantom token summary */}
          <div className="jwt-phantom-summary">
            <div className="jwt-phantom-row">
              <span className="jwt-phantom-actor">🌐 Client (Internet)</span>
              <span className="jwt-phantom-carries">cầm Opaque Token</span>
              <code className="md-code-inline">7b9a-4c2f</code>
              <span className="jwt-phantom-size">~36 bytes</span>
            </div>
            <div className="jwt-phantom-divider">↕ API Gateway làm "phiên dịch"</div>
            <div className="jwt-phantom-row">
              <span className="jwt-phantom-actor">🏭 Microservices (LAN)</span>
              <span className="jwt-phantom-carries">nhận JWT đầy đủ</span>
              <code className="md-code-inline">eyJ... 4KB</code>
              <span className="jwt-phantom-size">~4096 bytes</span>
            </div>
          </div>
        </Section>

        {/* Section 12 */}
        <Section num="12" title="Khi nào KHÔNG nên dùng JWT?" badge="common mistake">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec12}
          </ReactMarkdown>

          <div className="jwt-tradeoff-grid">
            <TradeoffCard
              icon="🏠"
              title="Dùng Session khi..."
              variant="session"
              items={[
                'Hệ thống Monolith — một server duy nhất',
                'Quyền hạn thay đổi liên tục, cần hiệu lực ngay',
                'Core Banking — kiểm soát trạng thái tuyệt đối',
                'Chỉ phục vụ Web Browser (cookie hoạt động tốt)',
              ]}
            />
            <TradeoffCard
              icon="🚀"
              title="Dùng JWT khi..."
              variant="jwt"
              items={[
                'Microservices quy mô lớn — Zero Trust architecture',
                'SSO, OAuth2, OIDC — xác thực liên hệ sinh thái',
                'Phục vụ cả Web lẫn Mobile App đồng thời',
                'Cần Scale ngang không giới hạn (stateless)',
              ]}
            />
          </div>
        </Section>

        {/* Section 13 */}
        <Section num="13" title="JWT thực sự tỏa sáng ở đâu?" badge="best fit">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec13}
          </ReactMarkdown>

          <div className="jwt-selfcontained" style={{ marginTop: 20 }}>
            <div className="jwt-sc-label">JWT sinh ra để giải quyết</div>
            <div className="jwt-sc-row">
              <div className="jwt-sc-item">
                <span className="jwt-sc-icon">🌐</span>
                <span className="jwt-sc-text">Sự phân tán</span>
              </div>
              <span className="jwt-sc-plus">+</span>
              <div className="jwt-sc-item">
                <span className="jwt-sc-icon">🤝</span>
                <span className="jwt-sc-text">Ủy quyền</span>
              </div>
              <span className="jwt-sc-plus">+</span>
              <div className="jwt-sc-item">
                <span className="jwt-sc-icon">🔓</span>
                <span className="jwt-sc-text">Liên hệ sinh thái</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 14 — Conclusion */}
        <Section num="14" title="Lời kết: Công cụ, không phải chân lý" badge="takeaway">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {sec14}
          </ReactMarkdown>

          <div className="jwt-conclusion-box">
            <div className="jwt-conclusion-icon">🏛</div>
            <div className="jwt-conclusion-text">
              <strong className="md-strong">Kiến trúc không có đúng sai tuyệt đối</strong>
              <br />
              Chỉ có phù hợp hay không phù hợp với bối cảnh và yêu cầu thực tế.
            </div>
          </div>
        </Section>

      </div>
    </div>
  )
}
