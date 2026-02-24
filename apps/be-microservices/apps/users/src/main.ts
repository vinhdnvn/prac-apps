import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { UsersModule } from './users.module'

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.PORT ?? '3001'),
      },
    },
  )
  await app.listen()
  console.log(`[users] microservice listening on TCP :${process.env.PORT ?? 3001}`)
}
bootstrap()
