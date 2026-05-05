import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { TICKET_QUEUE } from './queue.constants';
import { TicketProcessor } from '../../modules/tickets/tickets.processor'; // <-- Ensure this path is correct

// Extract the queue registration so we can use it in imports AND exports
const TicketQueueProvider = BullModule.registerQueue({
  name: TICKET_QUEUE,
});

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    TicketQueueProvider, // <-- Import it here
  ],
  providers: [TicketProcessor],
  exports: [TicketQueueProvider], // <-- CRITICAL: Export it so TicketsService can use @InjectQueue
})
export class QueueModule {}