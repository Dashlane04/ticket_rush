import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TICKET_QUEUE } from './queue.constants';

@Processor(TICKET_QUEUE)
export class TicketProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const { seatId, userId, showtimeId } = job.data;

    console.log(`Processing booking for User ${userId} - Seat ${seatId}`);

    // 1. (Optional) Call your Worker Pool here for heavy crypto/PDF generation
    // const hash = await this.workerPool.run(job.data);

    // 2. Finalize Database Write
    // await this.db.tickets.save({ userId, seatId, showtimeId, status: 'CONFIRMED' });

    return { success: true };
  }
}