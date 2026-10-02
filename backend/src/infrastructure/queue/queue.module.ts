import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TICKET_QUEUE } from './queue.constants';
import { TicketProcessor } from 'src/modules/tickets/tickets.processor';

const TicketQueueProvider = BullModule.registerQueue({
  name: TICKET_QUEUE,
});

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: Number(config.getOrThrow<string | number>('REDIS_PORT')),
          password: config.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    TicketQueueProvider,
  ],
  providers: [TicketProcessor],
  exports: [TicketQueueProvider],
})
export class QueueModule {}
