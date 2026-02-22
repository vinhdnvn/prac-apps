import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TodoApp from './pages/TodoApp'
import DSA from './pages/DSA'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/todo" element={<TodoApp />} />
        <Route path="/dsa" element={<DSA />} />
      </Routes>
    </BrowserRouter>
  )
}
