import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { USERS_SERVICE, GET_USERS, GET_USER_BY_ID, CREATE_USER } from '@app/common'

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  findAll() {
    return this.client.send({ cmd: GET_USERS }, {})
  }

  findById(id: number) {
    return this.client.send({ cmd: GET_USER_BY_ID }, id)
  }

  create(data: { name: string; email: string }) {
    return this.client.send({ cmd: CREATE_USER }, data)
  }
}
