import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';

import { TICKET_QUEUE } from 'src/infrastructure/queue/queue.constants';
import { RedisService } from 'src/redis/redis.service';
import { BookingTransaction } from './entities/transaction.entity';
import { Ticket } from './entities/tickets.entity';
import { ShowtimeSeat, SeatStatus } from './entities/showtime-seat.entity';

@Processor(TICKET_QUEUE)
export class TicketProcessor extends WorkerHost {
  constructor(
    private dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job) {
    const { userId, seatId, showtimeId, price, metadata } = job.data;

    return await this.dataSource.transaction(async (manager) => {
      const seat = await manager.findOne(ShowtimeSeat, {
        where: { showtimeId, seatNumber: seatId },
      });

      if (!seat) {
        throw new Error('Seat not found for processing.');
      }

      if (seat.status === SeatStatus.SOLD) {
        throw new Error('Seat already sold.');
      }

      try {
        const ticket = manager.create(Ticket, {
          userId,
          seatId,
          showtimeId,
          price,
          metadata,
          status: 'CONFIRMED',
        });
        const savedTicket = await manager.save(ticket);

        await manager.update(ShowtimeSeat, seat.id, {
          status: SeatStatus.SOLD,
          userId,
        });

        const transaction = manager.create(BookingTransaction, {
          ticketId: savedTicket.id,
          amount: price,
          status: 'COMPLETED',
          paymentProviderId: 'MOCK_PAYMENT_123',
        });
        await manager.save(transaction);

        return { success: true, ticketId: savedTicket.id };
      } catch (error) {
        await manager.update(ShowtimeSeat, seat.id, {
          status: SeatStatus.AVAILABLE,
          userId: null,
        });
        throw error;
      } finally {
        await this.redisService.unlockSeat(showtimeId, seatId);
      }
    });
  }
}
