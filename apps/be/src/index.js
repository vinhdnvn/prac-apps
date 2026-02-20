const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from BE!' })
})

app.listen(PORT, () => {
  console.log(`BE running on port ${PORT}`)
})
