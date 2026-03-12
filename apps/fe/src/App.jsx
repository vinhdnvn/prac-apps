import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TodoApp from './pages/TodoApp'
import DSA from './pages/DSA'
import NestJS from './pages/NestJS'
import NodeJS from './pages/NodeJS'
import StreamBuffer from './pages/StreamBuffer'
import JWT from './pages/JWT'
import Storage from './pages/Storage'
import ArrangeCoins from './pages/ArrangeCoins'
import NextGreatestLetter from './pages/NextGreatestLetter'
import Trading from './pages/Trading'
import SelfHosting from './pages/SelfHosting'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/todo" element={<TodoApp />} />
        <Route path="/dsa" element={<DSA />} />
        <Route path="/dsa/arrange-coins" element={<ArrangeCoins />} />
        <Route path="/dsa/next-greatest-letter" element={<NextGreatestLetter />} />
        <Route path="/nestjs" element={<NestJS />} />
        <Route path="/nodejs" element={<NodeJS />} />
        <Route path="/nodejs/stream-buffer" element={<StreamBuffer />} />
        <Route path="/jwt" element={<JWT />} />
        <Route path="/storage" element={<Storage />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/self-hosting" element={<SelfHosting />} />
      </Routes>
    </BrowserRouter>
  )
}
