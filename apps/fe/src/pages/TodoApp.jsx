import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TodoApp() {
  const navigate = useNavigate()
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  const fetchTodos = () =>
    fetch('/api/todos').then(r => r.json()).then(setTodos)

  useEffect(() => { fetchTodos() }, [])

  const addTodo = async () => {
    if (!input.trim()) return
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    })
    setInput('')
    fetchTodos()
  }

  const deleteTodo = async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    fetchTodos()
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

      <h1 className="page-title">Todo App</h1>
      <p className="page-tags">useState · useEffect · fetch · CRUD</p>

      <div className="todo-input-row">
        <input
          className="todo-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Add todo..."
        />
        <button className="todo-add-btn" onClick={addTodo}>Add</button>
      </div>

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className="todo-item">
            <span>{todo.text}</span>
            <button className="todo-delete-btn" onClick={() => deleteTodo(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
