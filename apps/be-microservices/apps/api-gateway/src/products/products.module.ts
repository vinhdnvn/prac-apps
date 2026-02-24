import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { PRODUCTS_SERVICE } from '@app/common'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCTS_HOST ?? 'localhost',
          port: parseInt(process.env.PRODUCTS_PORT ?? '3002'),
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
