import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TodoApp from './pages/TodoApp'
import DSA from './pages/DSA'
import NestJS from './pages/NestJS'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/todo" element={<TodoApp />} />
        <Route path="/dsa" element={<DSA />} />
        <Route path="/nestjs" element={<NestJS />} />
      </Routes>
    </BrowserRouter>
  )
}
