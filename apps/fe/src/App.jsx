import { useEffect, useState } from 'react'

function App() {
  const [hello, setHello] = useState(null)
  const [dbCheck, setDbCheck] = useState(null)

  useEffect(() => {
    fetch('/api/hello')
      .then(r => r.json())
      .then(setHello)
      .catch(() => setHello({ error: 'failed' }))

    fetch('/api/db-check')
      .then(r => r.json())
      .then(setDbCheck)
      .catch(() => setDbCheck({ error: 'failed' }))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>My K8s App</h1>

      <h2>BE API</h2>
      <pre>{JSON.stringify(hello, null, 2)}</pre>

      <h2>DB Check</h2>
      <pre>{JSON.stringify(dbCheck, null, 2)}</pre>
    </div>
  )
}

export default App
