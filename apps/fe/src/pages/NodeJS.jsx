import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
const callStackContent = `
## I. Call Stack — JS chỉ làm được một việc tại một thời điểm

JS không chạy song song. Mọi code đều phải xếp hàng và chạy từng cái một.

**Call Stack** là nơi code đang thực thi. Cứ gọi hàm là đẩy vào stack, hàm xong thì lấy ra.

Quan trọng: **khi stack còn đang chạy thứ gì đó, mọi callback async đều phải đứng chờ bên ngoài** — dù timeout đã hết, dù dữ liệu từ API đã về đủ hết.

> **Ghi nhớ:** Async không phải chạy song song — nó chỉ được chen vào khi code đồng bộ chạy xong hết.

---

## II. Sau khi stack rỗng — ai được chạy trước?

Khi stack rỗng, Node không chạy ngay các callback của \`setTimeout\` hay I/O. Nó ưu tiên chạy hai loại callback "khẩn cấp" trước:

| Ưu tiên | Loại | Ví dụ |
|---|---|---|
| 1 — cao nhất | \`process.nextTick\` | Callback đăng ký bằng \`nextTick(fn)\` |
| 2 | Promise callback | \`.then()\`, \`async/await\`, \`queueMicrotask()\` |

**Tại sao \`nextTick\` lại cao hơn Promise?** Đó là thiết kế của Node — \`nextTick\` ra đời trước Promise, nó nằm ở một hàng riêng và được xử lý trước.

> **Cẩn thận:** Nếu bạn gọi \`nextTick\` liên tục bên trong nhau (đệ quy), các callback của \`setTimeout\` và I/O sẽ **không bao giờ được chạy** — vì hàng \`nextTick\` không bao giờ hết.

\`\`\`javascript
// Đừng làm vầy — setTimeout sẽ không bao giờ chạy được
function loop() { process.nextTick(loop) }
loop()
\`\`\`

---

## III. Event Loop — vòng lặp kiểm tra việc

Sau khi chạy hết callback khẩn cấp ở trên, Node bắt đầu đi qua các "trạm" theo thứ tự:

\`\`\`
1. timers        → chạy callback của setTimeout, setInterval đã đến hạn
2. pending I/O   → xử lý lỗi I/O còn sót từ vòng trước
3. idle, prepare → Node tự dùng nội bộ, mình không cần quan tâm
4. poll          → chờ và nhận kết quả từ I/O (đọc file, gọi API...)
5. check         → chạy callback của setImmediate
6. close         → dọn dẹp khi kết nối bị đóng (vd: socket đóng)
\`\`\`

Và sau **mỗi trạm**, Node lại chạy hết \`nextTick\` rồi chạy hết Promise callback trước khi sang trạm tiếp — callback khẩn cấp luôn được ưu tiên chen vào giữa.

---

## IV. Thứ tự chạy — nhớ cái này là đủ

\`\`\`
Code bình thường (đồng bộ)
  → process.nextTick
  → Promise .then / async-await
  → setTimeout / setInterval
  → Kết quả I/O (đọc file, database, HTTP...)
  → setImmediate
  → Dọn dẹp kết nối đóng
\`\`\`

---

## V. Những điều hay bị nhầm

**1. Promise chạy trước setTimeout — luôn luôn**

\`\`\`javascript
setTimeout(() => console.log('B'))
Promise.resolve().then(() => console.log('A'))

// In ra: A → B
// Vì Promise callback được xử lý ngay khi stack rỗng,
// còn setTimeout phải đợi đến trạm timers
\`\`\`

**2. nextTick chạy trước Promise — luôn luôn**

\`\`\`javascript
Promise.resolve().then(() => console.log('B'))
process.nextTick(() => console.log('A'))

// In ra: A → B
\`\`\`

**3. setTimeout(0) vs setImmediate — không đoán được ở top-level**

\`\`\`javascript
setTimeout(() => console.log('timeout'))
setImmediate(() => console.log('immediate'))
// Có thể ra: timeout → immediate
// Cũng có thể ra: immediate → timeout
// Phụ thuộc vào tốc độ khởi động của máy, ĐỪNG dựa vào cái này
\`\`\`

Nhưng **bên trong callback của I/O** (đọc file, kết nối DB...) thì \`setImmediate\` **luôn** chạy trước \`setTimeout(0)\`:

\`\`\`javascript
fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'))      // ← chạy sau
  setImmediate(() => console.log('immediate'))  // ← chạy trước
})
// Lý do: khi đang ở trong I/O callback, trạm tiếp theo là check (setImmediate),
// còn timers phải đợi vòng lặp sau
\`\`\`

**4. setTimeout đăng ký bên trong Promise thì chậm hơn setTimeout bên ngoài**

\`\`\`javascript
Promise.resolve().then(() => {
  setTimeout(() => console.log('A')) // đăng ký sau
})
setTimeout(() => console.log('B'))   // đăng ký trước

// In ra: B → A
// B được đăng ký vào timers trước khi Promise callback chạy
\`\`\`

---

## VI. Hình dung đơn giản — 3 tầng

| Tầng | Gồm những gì | Khi nào chạy |
|---|---|---|
| **Code thường** | Mọi code đồng bộ | Ngay lập tức, ưu tiên nhất |
| **Việc khẩn cấp** | nextTick, Promise | Ngay khi stack vừa rỗng, chen vào giữa mọi trạm |
| **Việc đã lên lịch** | setTimeout, I/O, setImmediate | Theo từng trạm, lần lượt |

> Tầng "Việc khẩn cấp" luôn được chạy hết trước khi chuyển sang trạm tiếp theo — không bao giờ bị bỏ qua.

---

## VII. Nhận định sai - dễ hiểu lầm 

- \`setTimeout(0)\` chạy trước \`setImmediate\` ở ngoài cùng — **sai, không đảm bảo**
- Sau Promise là chạy ngay setTimeout — **sai, còn phụ thuộc I/O**
- Nhiều I/O cạnh tranh thì thứ tự ổn định — **sai**

---

## VIII. Lưu ý 

> Node luôn ưu tiên **"những việc đã hứa làm ngay trong lần này"** (Promise, nextTick) trước khi chuyển sang **"những việc đã đặt lịch cho sau"** (setTimeout, I/O, setImmediate).
`

const topics = [
  {
    id: 'callstack',
    title: 'Call Stack & Event Loop',
    badge: 'core concept',
    content: callStackContent,
  },
]

export default function NodeJS() {
  const navigate = useNavigate()
  const [active, setActive] = useState(null)

  return (
    <div className="page nestjs-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

      <h1 className="page-title">Node.js / JavaScript</h1>
      <p className="page-tags">Runtime · Event Loop · Async · V8</p>

      <div className="nestjs-cards">
        {topics.map(t => (
          <div key={t.id} className="nestjs-card">
            <button
              className="nestjs-card-header"
              onClick={() => setActive(active === t.id ? null : t.id)}
            >
              <div className="nestjs-card-left">
                <span className="nestjs-card-title">{t.title}</span>
                <span className="nestjs-badge">{t.badge}</span>
              </div>
              <span className="pcard-toggle">{active === t.id ? '▲' : '▼'}</span>
            </button>

            {active === t.id && (
              <div className="nestjs-card-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
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
                    a: ({ href, children }) => (
                      <a className="md-link" href={href} target="_blank" rel="noreferrer">{children}</a>
                    ),
                    li: ({ children }) => <li className="md-li">{children}</li>,
                  }}
                >
                  {t.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
