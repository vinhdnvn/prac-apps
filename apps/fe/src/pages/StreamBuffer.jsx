import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const TOTAL_CHUNKS = 6
const BUFFER_MAX = 3
const CHUNK_MB = 32

const mdContent = `
## Binary Data

Mọi thứ trong máy tính đều là **chuỗi bit nhị phân** — 0 và 1. Chữ "A" là \`01000001\`, số 128 là \`10000000\`. Một pixel màu đỏ là 3 byte RGB.

Node.js làm việc với binary data qua đối tượng \`Buffer\` — vùng bộ nhớ nằm ngoài V8 heap, lưu trực tiếp dạng bytes thô.

\`\`\`js
const buf = Buffer.from('Hello')
console.log(buf)            // <Buffer 48 65 6c 6c 6f>
console.log(buf[0])         // 72 — mã ASCII của 'H'
console.log(buf.toString()) // 'Hello'
\`\`\`

---

## Stream

**Stream** là chuỗi dữ liệu được truyền liên tiếp từng phần — không cần load toàn bộ vào RAM rồi mới xử lý.

Mỗi phần đó gọi là **chunk**. Node cắt data thành mảng chunks và ship lần lượt qua stream.

> Ví dụ: file 128 MB → chia thành 4 chunks 32 MB → ship từng cái.
> Tại bất kỳ thời điểm nào, RAM chỉ cần giữ 1 chunk thay vì toàn bộ 128 MB.
>
> Đây là cách Node xử lý lượng lớn dữ liệu mà không bị ngốn RAM.

### 4 loại stream

| Loại | Mô tả | Ví dụ |
|---|---|---|
| **Readable** | Chỉ đọc dữ liệu ra | \`fs.createReadStream()\` |
| **Writable** | Chỉ ghi dữ liệu vào | \`fs.createWriteStream()\` |
| **Duplex** | Vừa đọc vừa ghi cùng lúc | TCP socket |
| **Transform** | Đọc vào → biến đổi → ghi ra | \`zlib.createGzip()\` — nén data |

---

## Buffer

**Buffer** là vùng chờ tạm thời khi tốc độ gửi và tốc độ xử lý không khớp nhau.

Khi xem phim online:
- Data đến **nhanh hơn** tốc độ play → chunks xếp hàng chờ trong buffer
- Play **nhanh hơn** data đến → player phải chờ chunk tiếp theo về

Buffer nằm ở RAM — vùng bộ nhớ vật lý nhỏ giữ tạm data trước khi xử lý tiếp.

Node không kiểm soát được tốc độ mạng hay đọc/ghi đĩa → **buffer luôn cần thiết trong bất kỳ I/O nào.**

---

## Buffer liên quan đến Binary Data như thế nào?

Buffer trong Node.js **chính là** đối tượng lưu binary data thô. Khi stream đọc file, mỗi chunk được đóng gói vào một \`Buffer\` object.

\`\`\`js
const stream = fs.createReadStream('movie.mp4')

stream.on('data', (chunk) => {
  console.log(Buffer.isBuffer(chunk)) // true
  console.log(chunk.length)           // số bytes trong chunk
})
\`\`\`

**Stream vận chuyển. Buffer chứa. Data thực chất là bytes.** Đó là vòng tròn đầy đủ.
`

// ─── Simulator ────────────────────────────────────────────────────────────────

function Simulator() {
  const [sent, setSent] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const [speed, setSpeed] = useState('balanced')

  const sentRef = useRef(0)
  const processedRef = useRef(0)
  const logIdRef = useRef(0)
  const sendTimer = useRef(null)
  const processTimer = useRef(null)
  const logBoxRef = useRef(null)

  const SPEEDS = {
    'fast-send':    { send: 450,  proc: 1800 },
    'balanced':     { send: 900,  proc: 900  },
    'fast-process': { send: 1800, proc: 450  },
  }

  const pushLog = (msg) => {
    logIdRef.current += 1
    const id = logIdRef.current
    setLog(prev => [...prev.slice(-6), { id, msg }])
  }

  useEffect(() => {
    if (logBoxRef.current)
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
  }, [log])

  function stopTimers() {
    clearInterval(sendTimer.current)
    clearInterval(processTimer.current)
  }

  function stop() { stopTimers(); setRunning(false) }

  function reset() {
    stopTimers()
    sentRef.current = 0
    processedRef.current = 0
    setSent(0)
    setProcessed(0)
    setRunning(false)
    setLog([])
  }

  function startSim() {
    if (running || processed >= TOTAL_CHUNKS) return
    setRunning(true)
    const { send, proc } = SPEEDS[speed]

    sendTimer.current = setInterval(() => {
      const s = sentRef.current
      if (s >= TOTAL_CHUNKS) { clearInterval(sendTimer.current); return }
      const inBuf = s - processedRef.current
      if (inBuf >= BUFFER_MAX) {
        pushLog(`⚠ Buffer đầy [${BUFFER_MAX}/${BUFFER_MAX}] — stream tạm dừng`)
        return
      }
      sentRef.current = s + 1
      setSent(s + 1)
      pushLog(`→ Chunk ${s + 1}/${TOTAL_CHUNKS} (${CHUNK_MB}MB) vào buffer`)
    }, send)

    processTimer.current = setInterval(() => {
      const p = processedRef.current
      if (p >= TOTAL_CHUNKS) {
        stopTimers()
        setRunning(false)
        pushLog(`✅ Hoàn tất — tất cả ${TOTAL_CHUNKS} chunks đã xử lý`)
        return
      }
      if (p >= sentRef.current) {
        pushLog('⏳ Processor đang chờ — buffer trống')
        return
      }
      processedRef.current = p + 1
      setProcessed(p + 1)
      pushLog(`✓  Chunk ${p + 1} xử lý xong → output`)
    }, proc)
  }

  useEffect(() => () => stopTimers(), [])

  const buffered = Math.max(0, sent - processed)
  const bufPct   = Math.min(100, (buffered / BUFFER_MAX) * 100)
  const donePct  = (processed / TOTAL_CHUNKS) * 100
  const isDone   = processed >= TOTAL_CHUNKS

  return (
    <div className="sim">
      {/* ── Controls ── */}
      <div className="sim-header">
        <div className="sim-speeds">
          {[
            { k: 'fast-send',    label: 'Input nhanh',    desc: 'buffer tích tụ' },
            { k: 'balanced',     label: 'Balanced',       desc: 'luân chuyển đều' },
            { k: 'fast-process', label: 'Process nhanh',  desc: 'buffer trống, phải chờ' },
          ].map(({ k, label, desc }) => (
            <button
              key={k}
              className={`sim-speed ${speed === k ? 'sim-speed--on' : ''}`}
              onClick={() => { reset(); setSpeed(k) }}
            >
              <span className="sim-speed-label">{label}</span>
              <span className="sim-speed-desc">{desc}</span>
            </button>
          ))}
        </div>
        <div className="sim-actions">
          {running
            ? <button className="sim-btn sim-btn--pause" onClick={stop}>⏸ Pause</button>
            : <button className="sim-btn sim-btn--play" onClick={startSim} disabled={isDone}>
                {isDone ? '✅ Done' : '▶ Start'}
              </button>
          }
          <button className="sim-btn sim-btn--reset" onClick={reset}>↺</button>
        </div>
      </div>

      {/* ── Pipeline ── */}
      <div className="sim-pipeline">

        {/* Source */}
        <div className="sim-node sim-node--src">
          <div className="sim-node-tag">SOURCE</div>
          <div className="sim-node-name">movie.mp4</div>
          <div className="sim-node-size">{TOTAL_CHUNKS * CHUNK_MB} MB</div>
          <div className="sim-chunks">
            {Array.from({ length: TOTAL_CHUNKS }, (_, i) => (
              <div key={i} className={`sim-c ${i < sent ? 'sim-c--gone' : 'sim-c--src'}`}>
                {CHUNK_MB}
              </div>
            ))}
          </div>
          <div className="sim-node-sub">{TOTAL_CHUNKS - sent} chunks còn</div>
        </div>

        {/* Pipe → buffer */}
        <div className="sim-pipe-col">
          <div className="sim-pipe-name">stream</div>
          <div className={`sim-pipe-track ${running && sent < TOTAL_CHUNKS ? 'sim-pipe--on' : ''}`}>
            <div className="sim-pipe-dot" />
            <div className="sim-pipe-dot sim-pipe-dot--b" />
          </div>
          <div className="sim-pipe-chevron">›</div>
          <div className="sim-pipe-stat">{sent}/{TOTAL_CHUNKS} sent</div>
        </div>

        {/* Buffer */}
        <div className="sim-node sim-node--buf">
          <div className="sim-node-tag">BUFFER</div>
          <div className="sim-node-name">RAM</div>
          <div className="sim-buf-bar-row">
            <div className="sim-buf-bar">
              <div
                className={`sim-buf-fill ${
                  bufPct >= 100 ? 'sim-buf-full' : bufPct > 55 ? 'sim-buf-med' : ''
                }`}
                style={{ width: `${bufPct}%` }}
              />
            </div>
            <span className="sim-buf-cnt">{buffered}/{BUFFER_MAX}</span>
          </div>
          <div className="sim-chunks">
            {Array.from({ length: BUFFER_MAX }, (_, i) => (
              <div key={i} className={`sim-c ${i < buffered ? 'sim-c--buf' : 'sim-c--slot'}`}>
                {i < buffered ? `${CHUNK_MB}` : '—'}
              </div>
            ))}
          </div>
          <div className={`sim-node-sub ${
            bufPct >= 100 ? 'sim-sub--warn' : buffered === 0 ? 'sim-sub--idle' : ''
          }`}>
            {bufPct >= 100 ? '⚠ Đầy — stream dừng' : buffered === 0 ? '○ Trống' : `${buffered} chunk chờ`}
          </div>
        </div>

        {/* Pipe → output */}
        <div className="sim-pipe-col">
          <div className="sim-pipe-name">process</div>
          <div className={`sim-pipe-track ${running && buffered > 0 ? 'sim-pipe--on' : ''}`}>
            <div className="sim-pipe-dot" />
            <div className="sim-pipe-dot sim-pipe-dot--b" />
          </div>
          <div className="sim-pipe-chevron">›</div>
          <div className="sim-pipe-stat">{processed}/{TOTAL_CHUNKS} done</div>
        </div>

        {/* Output */}
        <div className="sim-node sim-node--out">
          <div className="sim-node-tag">OUTPUT</div>
          <div className="sim-node-name">{isDone ? '✅ Done' : '▶ Playing'}</div>
          <div className="sim-progress-row">
            <div className="sim-progress-bar">
              <div className="sim-progress-fill" style={{ width: `${donePct}%` }} />
            </div>
            <span className="sim-progress-pct">{Math.round(donePct)}%</span>
          </div>
          <div className="sim-node-size">{processed * CHUNK_MB}/{TOTAL_CHUNKS * CHUNK_MB} MB</div>
          <div className="sim-node-sub">{processed}/{TOTAL_CHUNKS} chunks</div>
        </div>
      </div>

      {/* ── Log terminal ── */}
      <div className="sim-log" ref={logBoxRef}>
        {log.length === 0
          ? <span className="sim-log-empty">Nhấn ▶ Start để bắt đầu simulation...</span>
          : log.map((l, idx) => (
            <div
              key={l.id}
              className={`sim-log-line ${idx === log.length - 1 ? 'sim-log-latest' : ''}`}
            >
              {l.msg}
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const mdComponents = {
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
  li: ({ children }) => <li className="md-li">{children}</li>,
}

export default function StreamBuffer() {
  const navigate = useNavigate()

  return (
    <div className="page sb-page">
      <button className="back-btn" onClick={() => navigate('/nodejs')}>← Node.js</button>
      <h1 className="page-title">Stream & Buffer</h1>
      <p className="page-tags">Binary Data · Chunks · I/O · Flow Control</p>

      <div className="sb-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {mdContent}
        </ReactMarkdown>
      </div>

      <div className="sb-sim-section">
        <div className="sb-sim-header">
          <h2 className="sb-sim-title">Simulator — {TOTAL_CHUNKS * CHUNK_MB}MB file streaming</h2>
          <p className="sb-sim-desc">
            Thay đổi tốc độ để xem buffer phản ứng như thế nào. Chú ý khi buffer đầy và khi processor phải chờ.
          </p>
        </div>
        <Simulator />
      </div>
    </div>
  )
}
