import { Module } from '@nestjs/common'
import { HealthController } from './health/health.controller'
import { UsersModule } from './users/users.module'
import { ProductsModule } from './products/products.module'

@Module({
  imports: [UsersModule, ProductsModule],
  controllers: [HealthController],
})
export class AppModule {}
