import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import redisConfig from './configs/redis.config';
import { DatabaseModule } from './database/database.module';
import { validate } from './configs/env.validate';
import { QueueModule } from './infrastructure/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AdminModule } from './modules/users/admin/admin.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './redis/redis.module';
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
    ScheduleModule.forRoot(),
    QueueModule,
    TicketsModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
