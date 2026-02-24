import { Body, Controller, Get, Param, Post, ParseIntPipe } from '@nestjs/common'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll()
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id)
  }

  @Post()
  create(@Body() body: { name: string; price: number }) {
    return this.productsService.create(body)
  }
}
