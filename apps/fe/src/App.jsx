import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TodoApp from './pages/TodoApp'
import DSA from './pages/DSA'
import NestJS from './pages/NestJS'
import NodeJS from './pages/NodeJS'
import StreamBuffer from './pages/StreamBuffer'
import JWT from './pages/JWT'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/todo" element={<TodoApp />} />
        <Route path="/dsa" element={<DSA />} />
        <Route path="/nestjs" element={<NestJS />} />
        <Route path="/nodejs" element={<NodeJS />} />
        <Route path="/nodejs/stream-buffer" element={<StreamBuffer />} />
        <Route path="/jwt" element={<JWT />} />
      </Routes>
    </BrowserRouter>
  )
}
