import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Content ──────────────────────────────────────────────────────────────────

const secConcepts = `
**Self-hosting** là việc tự chạy ứng dụng trên máy chủ của mình — thay vì thuê cloud như AWS, Vercel, hay Railway.

> Bạn kiểm soát hoàn toàn: code, data, cấu hình, chi phí. Nhưng cũng tự chịu trách nhiệm về uptime, bảo mật, và vận hành.

### Các khái niệm cốt lõi

**Domain** — địa chỉ để người dùng truy cập (ví dụ: \`viktorvn.id.vn\`). Mua từ nhà cung cấp như inet.vn, Namecheap, GoDaddy.

**DNS (Domain Name System)** — hệ thống "phonebook" của internet, dịch domain thành IP. Khi browser gõ \`viktorvn.id.vn\`, DNS trả về IP để kết nối.

**Nameserver** — máy chủ DNS quản lý các record của domain. Mặc định là của nhà đăng ký, có thể đổi sang Cloudflare để dùng thêm tính năng proxy và tunnel.

**DNS Record** — bản ghi cụ thể trong DNS:
- \`A\` — trỏ domain → IPv4
- \`CNAME\` — trỏ domain → domain khác
- \`MX\` — dành cho email

**Cloudflare Tunnel** — tạo kết nối outbound từ máy bạn ra Cloudflare edge. Không cần public IP, không cần mở port router. Cloudflare làm relay.

**SSL/TLS** — giao thức mã hóa traffic. Cloudflare tự issue cert miễn phí và terminate HTTPS tại edge — máy local chỉ cần chạy HTTP.

**Self-hosted Runner** — máy của bạn đăng ký với GitHub để chạy CI/CD pipeline trực tiếp, không cần SSH từ ngoài vào.
`

const secFlow = `
### Request từ người dùng đến server

\`\`\`
User gõ viktorvn.id.vn
        │
        ▼
DNS lookup → Cloudflare IP
(nameserver của domain trỏ về Cloudflare)
        │
        ▼
Cloudflare Edge
· Terminate HTTPS
· Proxy request qua tunnel
        │
        ▼
Cloudflare Tunnel (outbound từ máy bạn)
        │
        ▼
Máy Linux local
· Docker container chạy app trên port 8081
        │
        ▼
Response trả ngược lại
\`\`\`

### Deploy tự động khi push code

\`\`\`
Developer push lên GitHub
        │
        ▼
GitHub phát hiện có workflow trigger
        │
        ▼
Self-hosted Runner nhận job
(runner đang chạy trên máy Linux của bạn)
        │
        ▼
docker build → docker stop → docker run
        │
        ▼
Container mới lên, serve traffic ngay
\`\`\`
`

const secSetup = `
### 1. Máy server

Bất kỳ máy Linux nào chạy 24/7. Không cần public IP — Cloudflare Tunnel lo phần expose ra internet.

\`\`\`
OS: Ubuntu / Debian
RAM: 1GB+ là đủ cho app nhỏ
Cần cài: Docker, cloudflared
\`\`\`

### 2. Domain → Cloudflare

\`\`\`
Mua domain ở inet.vn / Namecheap
        ↓
Add domain vào Cloudflare (free plan)
Cloudflare cấp 2 nameserver
        ↓
Vào nhà cung cấp → đổi nameserver → trỏ về Cloudflare
        ↓
Đợi propagate DNS (5 phút ~ vài tiếng)
        ↓
Cloudflare quản lý DNS từ đây
\`\`\`

### 3. Cloudflare Tunnel

\`\`\`bash
# Cài cloudflared
apt install cloudflared

# Login (mở browser authorize)
cloudflared tunnel login

# Tạo tunnel
cloudflared tunnel create viktor-tunnel

# Config: ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /home/user/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: viktorvn.id.vn
    service: http://localhost:8081
  - service: http_status:404

# Tạo DNS CNAME record tự động
cloudflared tunnel route dns viktor-tunnel viktorvn.id.vn

# Chạy như service
sudo cloudflared service install
sudo systemctl start cloudflared
\`\`\`

### 4. GitHub Actions Self-hosted Runner

\`\`\`bash
# Trên máy Linux — làm theo hướng dẫn ở
# GitHub repo → Settings → Actions → Runners → New self-hosted runner
mkdir actions-runner && cd actions-runner
./config.sh --url https://github.com/<user>/<repo> --token <TOKEN>
sudo ./svc.sh install
sudo ./svc.sh start
\`\`\`

Trong workflow file:

\`\`\`yaml
jobs:
  deploy:
    runs-on: self-hosted   # ← chạy trên máy của bạn, không phải cloud
    steps:
      - uses: actions/checkout@v4
      - run: |
          cd apps/fe
          docker build -t fe-app .
          docker stop fe-app || true
          docker rm fe-app || true
          docker run -d --name fe-app \\
            --restart always \\
            -p 127.0.0.1:8081:80 fe-app
\`\`\`
`

const secWhyNotSSH = `
GitHub Actions runner mặc định chạy trên máy cloud của GitHub. Máy bạn ở sau NAT → không có public IP → SSH từ ngoài vào **không được**.

Cloudflare Tunnel chỉ forward HTTP/HTTPS — không forward raw TCP (trừ Cloudflare Spectrum, tính phí).

**Giải pháp:** Self-hosted runner — máy bạn kết nối ra GitHub (outbound). GitHub không cần SSH vào máy bạn.

\`\`\`
❌ GitHub cloud → SSH → máy bạn   (thất bại vì NAT)

✅ Máy bạn → kết nối ra GitHub   (outbound, luôn work)
   GitHub gửi job xuống runner
   Runner chạy deploy ngay trên máy
\`\`\`
`

const secCompare = `
> Không có cách nào đúng hoàn toàn — tùy vào quy mô, ngân sách, và mức độ chịu đau của bạn.
`

// ─── Compare Table ─────────────────────────────────────────────────────────────

const compareRows = [
  { attr: 'Chi phí',        cloud: 'Trả theo usage',    self: 'Điện + internet' },
  { attr: 'Setup',          cloud: 'Cực đơn giản',      self: 'Phức tạp hơn' },
  { attr: 'Control',        cloud: 'Giới hạn',          self: 'Toàn quyền' },
  { attr: 'Uptime',         cloud: 'Đảm bảo SLA',       self: 'Tự lo' },
  { attr: 'Scale',          cloud: 'Tự động',           self: 'Tự cấu hình' },
  { attr: 'Public IP',      cloud: 'Có sẵn',            self: 'Không cần (dùng Tunnel)' },
  { attr: 'SSL/HTTPS',      cloud: 'Tự động',           self: 'Cloudflare lo' },
  { attr: 'CI/CD',          cloud: 'Dễ cấu hình',       self: 'Self-hosted runner' },
]

function CompareTable() {
  return (
    <div className="str-table-wrap">
      <table className="str-table">
        <thead>
          <tr>
            <th className="str-th str-th--attr">Tiêu chí</th>
            <th className="str-th str-th--cookie">☁️ Cloud (Vercel/Railway)</th>
            <th className="str-th str-th--local">🏠 Self-hosted</th>
          </tr>
        </thead>
        <tbody>
          {compareRows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'str-tr-even' : 'str-tr-odd'}>
              <td className="str-td str-td--attr">{row.attr}</td>
              <td className="str-td">{row.cloud}</td>
              <td className="str-td">{row.self}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

export default function SelfHosting() {
  const navigate = useNavigate()

  return (
    <div className="page jwt-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <h1 className="page-title">Self Hosting</h1>
      <p className="page-tags">Domain · DNS · Cloudflare Tunnel · Docker · CI/CD</p>

      <div className="jwt-sections">

        <Section num="01" title="Khái niệm cơ bản" badge="fundamentals">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secConcepts}
          </ReactMarkdown>
        </Section>

        <Section num="02" title="Flow hoạt động" badge="architecture">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secFlow}
          </ReactMarkdown>
        </Section>

        <Section num="03" title="Cách setup từ đầu" badge="step by step">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secSetup}
          </ReactMarkdown>
        </Section>

        <Section num="04" title="Tại sao không dùng SSH?" badge="gotcha">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secWhyNotSSH}
          </ReactMarkdown>
        </Section>

        <Section num="05" title="Cloud vs Self-hosted" badge="tradeoffs">
          <CompareTable />
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {secCompare}
          </ReactMarkdown>
        </Section>

      </div>
    </div>
  )
}
