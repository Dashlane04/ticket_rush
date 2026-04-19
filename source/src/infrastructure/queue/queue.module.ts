import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TICKET_QUEUE } from './queue.constants';
import { TicketProcessor } from './tickets.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: TICKET_QUEUE,
    }),
  ],
  providers: [TicketProcessor],
  exports: [BullModule], // Export so TicketsService can add jobs
})
export class QueueModule {}