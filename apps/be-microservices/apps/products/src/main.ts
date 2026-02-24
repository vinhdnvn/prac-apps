import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ProductsModule } from './products.module'

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.PORT ?? '3002'),
      },
    },
  )
  await app.listen()
  console.log(`[products] microservice listening on TCP :${process.env.PORT ?? 3002}`)
}
bootstrap()
