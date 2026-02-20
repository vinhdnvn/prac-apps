const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
const PORT = process.env.PORT || 3000

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: 5432,
  database: process.env.POSTGRES_DB || 'appdb',
  user: process.env.POSTGRES_USER || 'appuser',
  password: process.env.POSTGRES_PASSWORD || 'apppassword',
})

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from BE!' })
})

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time')
    res.json({ connected: true, time: result.rows[0].time })
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`BE running on port ${PORT}`)
})
