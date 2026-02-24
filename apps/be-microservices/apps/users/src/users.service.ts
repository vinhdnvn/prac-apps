import { Injectable } from '@nestjs/common'

interface User {
  id: number
  name: string
  email: string
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ]

  findAll(): User[] {
    return this.users
  }

  findById(id: number): User | undefined {
    return this.users.find(u => u.id === id)
  }

  create(data: { name: string; email: string }): User {
    const user: User = { id: this.users.length + 1, ...data }
    this.users.push(user)
    return user
  }
}
