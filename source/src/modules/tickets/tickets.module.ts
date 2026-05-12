import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq'; // <-- 1. Import BullModule

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeSeat } from './entities/showtime-seat.entity';
import { Ticket } from './entities/tickets.entity';
import { BookingTransaction } from './entities/transaction.entity';
import { TICKET_QUEUE } from '../../infrastructure/queue/queue.constants'; // <-- 2. Import your queue constant

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime, ShowtimeSeat, Ticket, BookingTransaction]),
    // 3. Register the queue directly inside this module!
    BullModule.registerQueue({
      name: TICKET_QUEUE,
    }),
    TypeOrmModule.forFeature([ShowtimeSeat, Ticket]), // <-- Ensure entities are registered for the processor
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}