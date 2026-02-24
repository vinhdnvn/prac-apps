import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { ProductsService } from './products.service'
import { GET_PRODUCTS, GET_PRODUCT_BY_ID, CREATE_PRODUCT } from '@app/common'

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({ cmd: GET_PRODUCTS })
  findAll() {
    return this.productsService.findAll()
  }

  @MessagePattern({ cmd: GET_PRODUCT_BY_ID })
  findById(@Payload() id: number) {
    return this.productsService.findById(id)
  }

  @MessagePattern({ cmd: CREATE_PRODUCT })
  create(@Payload() data: { name: string; price: number }) {
    return this.productsService.create(data)
  }
}
