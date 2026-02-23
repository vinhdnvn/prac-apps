import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const lifecycleContent = `
## Request Lifecycle

\`\`\`
Incoming Request
      ↓
  Middleware          ← global → module bound
      ↓
   Guards             ← global → controller → route
      ↓
 Interceptors         ← global → controller → route  (pre)
      ↓
   Pipes              ← global → controller → route → param
      ↓
  Controller          ← route handler
      ↓
   Service
      ↓
 Interceptors         ← (post — route → controller → global)
      ↓
Exception Filters     ← global → controller → route
      ↓
     Response
\`\`\`

---

## 1. Middleware

Được gọi **đầu tiên** khi request đến server. Có thể đọc/thay đổi thông tin \`req\`, \`res\` trước khi truyền đến route handler.

Có 2 loại:

**Global bound middleware** — đăng ký trên toàn ứng dụng, thường dùng với các package như \`cors\`, \`helmet\`, \`body-parser\`:
\`\`\`typescript
app.use(cors())
app.use(helmet())
\`\`\`

**Module bound middleware** — được dùng trong một module cụ thể để thực hiện logic riêng:
\`\`\`typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
\`\`\`

Thứ tự: **global bound → module bound**

---

## 2. Guards

Mục đích là **xác định xem có cho phép request được xử lý** bởi route handler hay không tại run-time (authorization, role-based access...).

Điểm khác biệt so với Middleware:

| | Middleware | Guard |
|---|---|---|
| Gọi \`next()\` | Không biết handler nào tiếp theo | Biết handler nào sẽ được gọi |
| Truy cập | \`req\`, \`res\` | \`ExecutionContext\` |
| Mục đích | Transform request | Allow / Deny |

Nhờ access vào **ExecutionContext**, Guard biết chính xác handler nào sẽ được gọi tiếp theo — giúp logic xử lý rõ ràng, dễ trace hơn middleware.

> **Khi nào dùng cái nào?**
> Dùng **Middleware** khi cần đọc / biến đổi thông tin request (log, parse header, attach metadata).
> Dùng **Guard** khi cần bảo vệ tài nguyên — check condition rồi cho phép hoặc từ chối request.

### Phân loại Guards

**Global Guards** — đăng ký toàn bộ app, áp dụng cho mọi route. Thường dùng cho rate limiting, logging, hoặc auth mặc định:
\`\`\`typescript
// main.ts
const app = await NestFactory.create(AppModule)
app.useGlobalGuards(new ThrottlerGuard())
\`\`\`

Ví dụ extend \`ThrottlerGuard\` từ \`@nestjs/throttler\` để thêm logging khi bị throttle:
\`\`\`typescript
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    console.warn(\`[THROTTLE] IP \${req.ip} bị rate limit\`)
    super.throwThrottlingException(context)
  }
}
\`\`\`

---

**Controller Guards** — áp dụng cho toàn bộ route trong một controller. Thường dùng cho JWT auth — bảo vệ nhóm endpoint liên quan:
\`\`\`typescript
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@Request() req) { return req.user }

  @Get('settings')
  getSettings(@Request() req) { return req.user.settings }
}
\`\`\`

---

**Route Guards** — áp dụng trên từng route cụ thể. Sau khi qua global và controller guard, route guard kiểm tra quyền cho từng action:
\`\`\`typescript
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  @Get()
  findAll() { return [] }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  remove(@Param('id') id: string) { return { deleted: id } }
}
\`\`\`

Thứ tự thực thi: **Global Guard → Controller Guard → Route Guard**

---

## 3. Interceptors

Cho phép **chèn logic vào quá trình xử lý request/response** — trước khi đến controller (Pre) hoặc sau khi có response trả về (Post).

Use cases điển hình: **audit log, caching, transformation, error handling**.

Vì xử lý cả 2 chiều nên interceptor chia làm 2 pha:

| Pha | Thời điểm | Ví dụ |
|---|---|---|
| **Pre** | Trước khi vào method handler | Log thời điểm bắt đầu request |
| **Post** | Sau khi method handler trả về | Log tổng thời gian thực thi |

\`\`\`typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now()
    console.log('→ Request in')

    return next.handle().pipe(
      tap(() => console.log(\`← Response out: \${Date.now() - start}ms\`))
    )
  }
}
\`\`\`

> **Lưu ý thứ tự Post:** Pre đi từ Global → Controller → Route, nhưng **Post đi ngược lại**: Route → Controller → Global. Tức là interceptor nào wrap ngoài cùng thì Post của nó chạy sau cùng.

**Global Interceptors** — apply toàn app, thường dùng cho logging tổng quát hoặc response transformation:
\`\`\`typescript
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor())
\`\`\`

**Controller Interceptors** — apply cho cả controller, ví dụ đo thời gian response của một nhóm endpoint:
\`\`\`typescript
@UseInterceptors(TimeoutInterceptor)
@Controller('flash-cards')
export class FlashCardsController { }
\`\`\`

**Route Interceptors** — apply cho từng route, ví dụ loại bỏ các field null trước khi trả về:
\`\`\`typescript
@Get()
@UseInterceptors(ExcludeNullInterceptor)
async findAll() { }
\`\`\`

Thứ tự Pre: **Global → Controller → Route** | Thứ tự Post: **Route → Controller → Global**

---

## 4. Pipes

Mục đích là **validate và transform data** từ request trước khi đến controller handler.

2 use case chính:

| Use case | Mô tả | Ví dụ |
|---|---|---|
| **Transformation** | Chuyển đổi kiểu dữ liệu | string \`"123"\` → number \`123\` |
| **Validation** | Kiểm tra tính hợp lệ của data | throw \`BadRequestException\` nếu sai format |

Pipes được gọi **sau Guards và Interceptors (Pre)**, chạy ngay trước khi vào method handler.

**Global Pipes** — thường dùng \`ValidationPipe\` để validate toàn bộ DTO:
\`\`\`typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
\`\`\`

**Controller Pipes** — validate/transform cho cả controller:
\`\`\`typescript
@UsePipes(ParseControllerValidationPipe)
@Controller('flash-cards')
export class FlashCardsController { }
\`\`\`

**Route Pipes** — validate cho một route cụ thể:
\`\`\`typescript
@Get()
@UsePipes(ParseRouteValidationPipe)
async findAll(@Query('limit') limit: number) { }
\`\`\`

**Route Parameter Pipes** — apply thẳng vào từng param, rất hay dùng để validate ID:
\`\`\`typescript
@Injectable()
export class ParseMongoIdPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isObjectIdOrHexString(value)) {
      throw new BadRequestException('Invalid ID format')
    }
    return value
  }
}

@Get(':id')
findOne(@Param('id', ParseMongoIdPipe) id: string) { }
\`\`\`

> **Lưu ý:** Khi pipe throw exception, request **dừng ngay tại đó** và nhảy thẳng sang Exception Filter — không chạm vào controller hay service.

Thứ tự: **Global Pipe → Controller Pipe → Route Pipe → Route Parameter Pipe**

---

## 5. Exception Filters

Là lớp **bắt tất cả exception** xảy ra trong ứng dụng — dù từ pipe, guard, interceptor hay service — và trả về response lỗi chuẩn hóa cho client.

Nếu không có filter tự định nghĩa, NestJS dùng **Global Exception Filter mặc định** để handle \`HttpException\`.

\`\`\`typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()
    const status = exception.getStatus()

    res.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: req.url,
    })
  }
}
\`\`\`

**Global Filter** — catch toàn bộ exception trong app:
\`\`\`typescript
// main.ts
app.useGlobalFilters(new HttpExceptionFilter())
\`\`\`

**Controller Filter** — chỉ catch exception trong controller đó:
\`\`\`typescript
@UseFilters(HttpExceptionFilter)
@Controller('flash-cards')
export class FlashCardsController { }
\`\`\`

**Route Filter** — chỉ catch exception của một route:
\`\`\`typescript
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() dto: CreateCardDto) { }
\`\`\`

> **Decorator \`@Catch()\`** nhận vào exception class cần bắt. Bỏ trống \`@Catch()\` → bắt tất cả mọi exception không phân biệt loại.

Thứ tự: **Global Filter → Controller Filter → Route Filter**

---

> Nguồn tham khảo: [Request Lifecycle trong NestJS — Viblo](https://viblo.asia/p/cach-request-lifecycle-hoat-dong-trong-nestjs-y3RL1awpLao)
`

function FlowNode({ label, sub, type, tag }) {
  return (
    <div className={`flow-node flow-node--${type}`}>
      <div className="flow-node-top">
        <span className="flow-node-label">{label}</span>
        {tag && <span className={`flow-tag flow-tag--${tag}`}>{tag}</span>}
      </div>
      {sub && <span className="flow-node-sub">{sub}</span>}
    </div>
  )
}

const topics = [
  {
    id: 'lifecycle',
    title: 'Request Lifecycle',
    badge: 'core concept',
    content: lifecycleContent,
  },
]

export default function NestJS() {
  const navigate = useNavigate()
  const [active, setActive] = useState(null)

  return (
    <div className="page nestjs-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

      <h1 className="page-title">NestJS</h1>
      <p className="page-tags">Backend · Architecture · Lifecycle · Decorators</p>

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
                <ReactMarkdown
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
                  }}
                >
                  {t.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Full Request Flow Diagram ── */}
      <div className="flow-wrap">
        <div className="flow-wrap-header">
          <span className="flow-wrap-title">Request Flow</span>
          <span className="nestjs-badge">full lifecycle</span>
        </div>

        <div className="flow-diagram">
          <FlowNode type="entry" label="Incoming Request" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="mw" label="Middleware" sub="global bound → module bound" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="guard" label="Guards" sub="global → controller → route" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="interceptor" label="Interceptors" sub="global → controller → route" tag="pre" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="pipe" label="Pipes" sub="global → controller → route → param" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="ctrl" label="Controller / Handler" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="service" label="Service" />

          <div className="flow-arrow">↓</div>
          <FlowNode type="interceptor" label="Interceptors" sub="route → controller → global" tag="post" />

          <div className="flow-arrow">↓</div>

          {/* Fork connector — SVG draws the branching lines */}
          <svg viewBox="0 0 420 28" width="420" height="28" style={{ display: 'block' }}>
            <line x1="210" y1="0"  x2="210" y2="14" stroke="#1e2d45" strokeWidth="1" />
            <line x1="100" y1="14" x2="320" y2="14" stroke="#1e2d45" strokeWidth="1" />
            <line x1="100" y1="14" x2="100" y2="28" stroke="#1e2d45" strokeWidth="1" />
            <line x1="320" y1="14" x2="320" y2="28" stroke="#1e2d45" strokeWidth="1" />
          </svg>

          {/* Two branches */}
          <div className="flow-fork-branches">
            <div className="flow-fork-branch">
              <span className="flow-fork-badge flow-fork-badge--ok">✓ no error</span>
              <div className="flow-arrow flow-arrow--sm">↓</div>
              <FlowNode type="response" label="Response" />
            </div>

            <div className="flow-fork-branch">
              <span className="flow-fork-badge flow-fork-badge--err">✗ exception</span>
              <div className="flow-arrow flow-arrow--sm">↓</div>
              <FlowNode type="filter" label="Exception Filters" sub="global → controller → route" />
              <div className="flow-arrow flow-arrow--sm">↓</div>
              <FlowNode type="response" label="Response" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
