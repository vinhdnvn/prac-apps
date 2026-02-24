import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PRODUCTS_SERVICE, GET_PRODUCTS, GET_PRODUCT_BY_ID, CREATE_PRODUCT } from '@app/common'

@Injectable()
export class ProductsService {
  constructor(@Inject(PRODUCTS_SERVICE) private readonly client: ClientProxy) {}

  findAll() {
    return this.client.send({ cmd: GET_PRODUCTS }, {})
  }

  findById(id: number) {
    return this.client.send({ cmd: GET_PRODUCT_BY_ID }, id)
  }

  create(data: { name: string; price: number }) {
    return this.client.send({ cmd: CREATE_PRODUCT }, data)
  }
}
