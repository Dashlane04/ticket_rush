import { Injectable, ConflictException } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { BookTicketDto } from './dto/book-ticket.dto';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TICKET_QUEUE, PROCESS_BOOKING_JOB } from '../../infrastructure/queue/queue.constants';

@Injectable()
export class TicketsService {
  constructor(
    private readonly redisService: RedisService,
    @InjectQueue(TICKET_QUEUE) private ticketQueue: Queue // inject the queue
  ) {}

  async reserveRequest(dto: BookTicketDto, userId: string) {
    // 1. Try the fast redis lock first (first method)
    const success = await this.redisService.tryLockSeat(dto.showtimeId, dto.seatId, userId);
    if (!success) throw new ConflictException('Seat taken');

    // 2. Add to the queue (second method)
    // add the job and return immediately to user
    await this.ticketQueue.add(PROCESS_BOOKING_JOB, {
      ...dto,
      userId,
    }, {
      attempts: 3, // retry if the DB is temporarily down
      backoff: 1000, // wait 1s before retry
    });

    return { status: 'pending', message: 'Request received. We are processing your ticket!' };
  }
}