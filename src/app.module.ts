import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import redisConfig from './configs/redis.config';
import { TenantModule } from './modules/tenant/tenant.module';
import { RoleModule } from './modules/role/role.module';
import { AuthModule } from './modules/auth/auth.module';
import { validate } from './configs/env.validate';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
      validate,
    }),
    DatabaseModule,
    TenantModule,
    RoleModule,
    UserModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
