import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
  BaselineSeries,
  CrosshairMode,
} from 'lightweight-charts'


function generateOHLC(count = 150, startPrice = 120) {
  const data = []
  let open = startPrice
  const now = Math.floor(Date.now() / 1000)
  const DAY = 86400
  for (let i = count; i >= 0; i--) {
    const time = now - i * DAY
    const change = (Math.random() - 0.48) * 4
    const close = Math.max(1, open + change)
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    data.push({
      time,
      open:  +open.toFixed(2),
      high:  +high.toFixed(2),
      low:   +low.toFixed(2),
      close: +close.toFixed(2),
    })
    open = close
  }
  return data
}

function generateSingleValue(count = 150, startPrice = 120) {
  const data = []
  let val = startPrice
  const now = Math.floor(Date.now() / 1000)
  const DAY = 86400
  for (let i = count; i >= 0; i--) {
    const time = now - i * DAY
    val = Math.max(1, val + (Math.random() - 0.48) * 3)
    data.push({ time, value: +val.toFixed(2) })
  }
  return data
}

function generateVolume(ohlcData) {
  return ohlcData.map(d => ({
    time: d.time,
    value: Math.floor(Math.random() * 5_000_000 + 500_000),
    color: d.close >= d.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
  }))
}

function calcMA(ohlcData, period) {
  return ohlcData.map((_, i, arr) => {
    if (i < period - 1) return null
    const slice = arr.slice(i - period + 1, i + 1)
    const avg = slice.reduce((s, d) => s + d.close, 0) / period
    return { time: arr[i].time, value: +avg.toFixed(2) }
  }).filter(Boolean)
}


const DARK = {
  layout: {
    background: { color: '#040a14' },
    textColor: '#64748b',
    fontSize: 11,
  },
  grid: {
    vertLines: { color: '#0d1625' },
    horzLines: { color: '#0d1625' },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: '#334155', width: 1, style: 2 },
    horzLine: { color: '#334155', width: 1, style: 2 },
  },
  rightPriceScale: { borderColor: '#1a2a40' },
  timeScale: { borderColor: '#1a2a40', timeVisible: true, secondsVisible: false },
  handleScroll: true,
  handleScale: true,
}


const DEFS = [
  {
    id: 'candlestick',
    label: '🕯 Candlestick',
    badge: 'OHLC',
    desc: 'Biểu đồ nến Nhật — thể hiện Open / High / Low / Close mỗi phiên. Nến xanh: close > open (tăng). Nến đỏ: close < open (giảm). Bóng nến (wick) thể hiện biên độ cao nhất và thấp nhất.',
    dataType: 'ohlc',
  },
  {
    id: 'bar',
    label: '▌ Bar',
    badge: 'OHLC',
    desc: 'Tương tự Candlestick nhưng dùng thanh dọc + tick ngang. Tick trái = Open, tick phải = Close. Kinh điển trên các platform cũ.',
    dataType: 'ohlc',
  },
  {
    id: 'line',
    label: '↗ Line',
    badge: 'value',
    desc: 'Đường nối các điểm giá đóng cửa. Đơn giản, hiệu quả để quan sát xu hướng chung. Thường dùng cho chỉ số (index) hoặc MA.',
    dataType: 'single',
  },
  {
    id: 'area',
    label: '◼ Area',
    badge: 'value',
    desc: 'Giống Line nhưng có vùng tô màu gradient bên dưới — nhấn mạnh biên độ dao động và trực quan hơn khi so sánh nhiều series.',
    dataType: 'single',
  },
  {
    id: 'baseline',
    label: '⇅ Baseline',
    badge: 'value',
    desc: 'Chia đôi theo một giá cơ sở (base price). Phần trên tô xanh (giá cao hơn base), phần dưới tô đỏ (thấp hơn base). Trực quan để xem performance so với mốc.',
    dataType: 'single',
  },
  {
    id: 'histogram',
    label: '▊ Histogram',
    badge: 'volume',
    desc: 'Biểu đồ cột — thường dùng cho volume giao dịch. Cột xanh: phiên tăng. Cột đỏ: phiên giảm. Có thể đặt ở pane riêng bên dưới candlestick.',
    dataType: 'volume',
  },
]


const SNIPPETS = {
  candlestick: `import { createChart, CandlestickSeries } from 'lightweight-charts'

const chart = createChart(container, {
  layout: { background: { color: '#040a14' }, textColor: '#64748b' },
  width: 600, height: 300,
})

const series = chart.addSeries(CandlestickSeries, {
  upColor:        '#26a69a',  downColor:        '#ef5350',
  borderUpColor:  '#26a69a',  borderDownColor:  '#ef5350',
  wickUpColor:    '#26a69a',  wickDownColor:    '#ef5350',
})

series.setData([
  { time: '2024-01-01', open: 100, high: 105, low: 98,  close: 103 },
  { time: '2024-01-02', open: 103, high: 108, low: 101, close: 106 },
])

chart.timeScale().fitContent()`,

  bar: `import { createChart, BarSeries } from 'lightweight-charts'

const chart = createChart(container, { width: 600, height: 300 })
const series = chart.addSeries(BarSeries, {
  upColor: '#26a69a', downColor: '#ef5350',
})
series.setData([
  { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103 },
])
chart.timeScale().fitContent()`,

  line: `import { createChart, LineSeries } from 'lightweight-charts'

const chart = createChart(container, { width: 600, height: 300 })
const series = chart.addSeries(LineSeries, {
  color: '#3b82f6', lineWidth: 2,
})
series.setData([
  { time: '2024-01-01', value: 100 },
  { time: '2024-01-02', value: 103 },
])
chart.timeScale().fitContent()`,

  area: `import { createChart, AreaSeries } from 'lightweight-charts'

const chart = createChart(container, { width: 600, height: 300 })
const series = chart.addSeries(AreaSeries, {
  lineColor:   '#3b82f6',
  topColor:    'rgba(59,130,246,0.35)',
  bottomColor: 'rgba(59,130,246,0.01)',
  lineWidth: 2,
})
series.setData([{ time: '2024-01-01', value: 100 }])`,

  baseline: `import { createChart, BaselineSeries } from 'lightweight-charts'

const chart = createChart(container, { width: 600, height: 300 })
const series = chart.addSeries(BaselineSeries, {
  baseValue:        { type: 'price', price: 100 },
  topLineColor:     '#26a69a',
  topFillColor1:    'rgba(38,166,154,0.3)',
  topFillColor2:    'rgba(38,166,154,0.02)',
  bottomLineColor:  '#ef5350',
  bottomFillColor1: 'rgba(239,83,80,0.02)',
  bottomFillColor2: 'rgba(239,83,80,0.3)',
})
series.setData([{ time: '2024-01-01', value: 105 }])`,

  histogram: `import { createChart, HistogramSeries } from 'lightweight-charts'

const chart = createChart(container, { width: 600, height: 300 })
const series = chart.addSeries(HistogramSeries, {
  color: 'rgba(38,166,154,0.5)',
  priceFormat: { type: 'volume' },
})
series.setData([
  { time: '2024-01-01', value: 1_500_000, color: 'rgba(38,166,154,0.5)' },
  { time: '2024-01-02', value: 980_000,   color: 'rgba(239,83,80,0.5)'  },
])`,
}


function ChartBlock({ def, ohlcData, singleData, volumeData }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef(null)
  const lastBarRef   = useRef(null)
  const liveRef      = useRef(null)
  const [crosshair, setCrosshair] = useState(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = createChart(el, { ...DARK, width: el.clientWidth, height: 260 })
    chartRef.current = chart

    let series

    switch (def.id) {
      case 'candlestick':
        series = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a', downColor: '#ef5350',
          borderUpColor: '#26a69a', borderDownColor: '#ef5350',
          wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        })
        series.setData(ohlcData)
        lastBarRef.current = ohlcData[ohlcData.length - 1]
        break

      case 'bar':
        series = chart.addSeries(BarSeries, { upColor: '#26a69a', downColor: '#ef5350' })
        series.setData(ohlcData)
        lastBarRef.current = ohlcData[ohlcData.length - 1]
        break

      case 'line':
        series = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2 })
        series.setData(singleData)
        lastBarRef.current = singleData[singleData.length - 1]
        break

      case 'area':
        series = chart.addSeries(AreaSeries, {
          lineColor: '#3b82f6',
          topColor: 'rgba(59,130,246,0.35)',
          bottomColor: 'rgba(59,130,246,0.01)',
          lineWidth: 2,
        })
        series.setData(singleData)
        lastBarRef.current = singleData[singleData.length - 1]
        break

      case 'baseline': {
        const mid = singleData[Math.floor(singleData.length / 2)]?.value ?? 100
        series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: mid },
          topLineColor: '#26a69a', topFillColor1: 'rgba(38,166,154,0.3)', topFillColor2: 'rgba(38,166,154,0.02)',
          bottomLineColor: '#ef5350', bottomFillColor1: 'rgba(239,83,80,0.02)', bottomFillColor2: 'rgba(239,83,80,0.3)',
        })
        series.setData(singleData)
        lastBarRef.current = singleData[singleData.length - 1]
        break
      }

      case 'histogram':
        series = chart.addSeries(HistogramSeries, {
          color: 'rgba(38,166,154,0.5)',
          priceFormat: { type: 'volume' },
        })
        series.setData(volumeData)
        lastBarRef.current = volumeData[volumeData.length - 1]
        break
    }

    seriesRef.current = series
    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time || !series) { setCrosshair(null); return }
      const d = param.seriesData.get(series)
      if (!d) { setCrosshair(null); return }
      setCrosshair('open' in d ? { type: 'ohlc', ...d } : { type: 'val', value: d.value })
    })

    const ro = new ResizeObserver(() => chart.resize(el.clientWidth, 260))
    ro.observe(el)

    return () => { ro.disconnect(); clearInterval(liveRef.current); chart.remove() }
  }, [def.id, ohlcData, singleData, volumeData])

  const toggleLive = useCallback(() => {
    if (live) {
      clearInterval(liveRef.current)
      setLive(false)
      return
    }
    setLive(true)
    liveRef.current = setInterval(() => {
      const series = seriesRef.current
      const prev   = lastBarRef.current
      if (!series || !prev) return
      const now = Math.floor(Date.now() / 1000)

      if (def.dataType === 'ohlc') {
        const open = prev.close
        const close = Math.max(1, open + (Math.random() - 0.48) * 4)
        const bar = {
          time:  now,
          open:  +open.toFixed(2),
          high:  +(Math.max(open, close) + Math.random() * 2).toFixed(2),
          low:   +(Math.min(open, close) - Math.random() * 2).toFixed(2),
          close: +close.toFixed(2),
        }
        series.update(bar)
        lastBarRef.current = bar
      } else if (def.dataType === 'volume') {
        const bar = {
          time: now,
          value: Math.floor(Math.random() * 5_000_000 + 500_000),
          color: Math.random() > 0.5 ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
        }
        series.update(bar)
        lastBarRef.current = bar
      } else {
        const bar = { time: now, value: +(Math.max(1, prev.value + (Math.random() - 0.48) * 3)).toFixed(2) }
        series.update(bar)
        lastBarRef.current = bar
      }
    }, 1000)
  }, [live, def.dataType])

  useEffect(() => () => clearInterval(liveRef.current), [])

  return (
    <div className="tc-block">
      <div className="tc-block-head">
        <div className="tc-block-left">
          <span className="tc-block-label">{def.label}</span>
          <span className="tc-badge">{def.badge}</span>
        </div>
        <div className="tc-block-right">
          {crosshair && (
            <div className="tc-crosshair">
              {crosshair.type === 'ohlc' ? (
                <>
                  <span className="tc-ch o">O <b>{crosshair.open}</b></span>
                  <span className="tc-ch h">H <b>{crosshair.high}</b></span>
                  <span className="tc-ch l">L <b>{crosshair.low}</b></span>
                  <span className="tc-ch c">C <b>{crosshair.close}</b></span>
                </>
              ) : (
                <span className="tc-ch v">
                  {def.id === 'histogram'
                    ? `Vol ${Number(crosshair.value).toLocaleString()}`
                    : `${crosshair.value?.toFixed?.(2) ?? crosshair.value}`}
                </span>
              )}
            </div>
          )}
          <button className={`tc-live-btn ${live ? 'on' : ''}`} onClick={toggleLive}>
            {live ? '⏹ Stop' : '▶ Live'}
          </button>
        </div>
      </div>

      <p className="tc-block-desc">{def.desc}</p>
      <div ref={containerRef} className="tc-chart-wrap" />

      <details className="tc-details">
        <summary className="tc-summary">{'</>'} code</summary>
        <pre className="tc-pre">{SNIPPETS[def.id]}</pre>
      </details>
    </div>
  )
}


function MainChart({ ohlcData, volumeData }) {
  const containerRef = useRef(null)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = createChart(el, { ...DARK, width: el.clientWidth, height: 420 })

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      borderUpColor: '#26a69a', borderDownColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    })
    candle.setData(ohlcData)

    const ma20 = chart.addSeries(LineSeries, {
      color: '#f59e0b', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma20.setData(calcMA(ohlcData, 20))

    const ma50 = chart.addSeries(LineSeries, {
      color: '#a78bfa', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma50.setData(calcMA(ohlcData, 50))

    const volPane = chart.addPane()
    const vol = chart.addSeries(HistogramSeries, {
      color: 'rgba(38,166,154,0.5)',
      priceFormat: { type: 'volume' },
    }, volPane.paneIndex())
    vol.setData(volumeData)

    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time) { setInfo(null); return }
      const d = param.seriesData.get(candle)
      if (!d) { setInfo(null); return }
      const diff = d.close - d.open
      setInfo({ ...d, diff: +diff.toFixed(2), pct: +((diff / d.open) * 100).toFixed(2) })
    })

    const ro = new ResizeObserver(() => chart.resize(el.clientWidth, 420))
    ro.observe(el)
    return () => { ro.disconnect(); chart.remove() }
  }, [ohlcData, volumeData])

  return (
    <div className="tc-main">
      <div className="tc-main-head">
        <div className="tc-main-left">
          <span className="tc-main-sym">MOCK / USD</span>
          <span className="tc-badge">candlestick</span>
          <span className="tc-badge tc-badge--ma20">MA20</span>
          <span className="tc-badge tc-badge--ma50">MA50</span>
          <span className="tc-badge">volume</span>
        </div>
        {info && (
          <div className="tc-crosshair">
            <span className="tc-ch o">O <b>{info.open}</b></span>
            <span className="tc-ch h">H <b>{info.high}</b></span>
            <span className="tc-ch l">L <b>{info.low}</b></span>
            <span className="tc-ch c">C <b>{info.close}</b></span>
            <span className={`tc-ch ${info.diff >= 0 ? 'pos' : 'neg'}`}>
              {info.diff >= 0 ? '+' : ''}{info.diff} ({info.pct}%)
            </span>
          </div>
        )}
      </div>
      <div ref={containerRef} className="tc-chart-wrap" />
    </div>
  )
}


const OHLC_DATA   = generateOHLC(150, 120)
const SINGLE_DATA = generateSingleValue(150, 120)
const VOLUME_DATA = generateVolume(OHLC_DATA)

export default function Trading() {
  const navigate   = useNavigate()
  const ohlcData   = OHLC_DATA
  const singleData = SINGLE_DATA
  const volumeData = VOLUME_DATA

  return (
    <div className="page tc-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <h1 className="page-title">Lightweight Charts</h1>
      <p className="page-tags">TradingView · Candlestick · Line · Area · Bar · Histogram · Baseline · Real-time</p>

      <div className="tc-section-label">Tổng quan — Candlestick + MA20 + MA50 + Volume (2 panes)</div>
      <MainChart ohlcData={ohlcData} volumeData={volumeData} />

      <div className="tc-section-label" style={{ marginTop: 36 }}>Tất cả Series Types — click ▶ Live để stream real-time</div>
      <div className="tc-grid">
        {DEFS.map(def => (
          <ChartBlock
            key={def.id}
            def={def}
            ohlcData={ohlcData}
            singleData={singleData}
            volumeData={volumeData}
          />
        ))}
      </div>
    </div>
  )
}
