import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TICKET_QUEUE } from 'src/infrastructure/queue/queue.constants';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { BookingTransaction } from './entities/transaction.entity';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeSeat } from './entities/showtime-seat.entity';
import { Ticket } from './entities/tickets.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

/** Cấu trúc như concur: `TypeOrmModule` + `registerQueue` trong cùng module. */
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Showtime, ShowtimeSeat, Ticket, BookingTransaction]),
    BullModule.registerQueue({ name: TICKET_QUEUE }),
    TypeOrmModule.forFeature([ShowtimeSeat, Ticket]),
    QueueModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
