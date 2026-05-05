import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { TicketsModule } from './modules/tickets/tickets.module'; // <-- Make sure this is here
import { AdminModule } from './modules/users/admin/admin.module'; // <-- Make sure this is here

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'postgres',
      database: process.env.DB_NAME ?? 'ticket_rush',
      synchronize: true,
      autoLoadEntities: true,
    }),
    RedisModule,
    QueueModule,
    TicketsModule, // <-- Add to imports array
    AdminModule,   // <-- Add to imports array
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}