import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { UsersService } from './users.service'
import { GET_USERS, GET_USER_BY_ID, CREATE_USER } from '@app/common'

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: GET_USERS })
  findAll() {
    return this.usersService.findAll()
  }

  @MessagePattern({ cmd: GET_USER_BY_ID })
  findById(@Payload() id: number) {
    return this.usersService.findById(id)
  }

  @MessagePattern({ cmd: CREATE_USER })
  create(@Payload() data: { name: string; email: string }) {
    return this.usersService.create(data)
  }
}
