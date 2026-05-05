import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { RedisService } from '../../infrastructure/redis/redis.service';
import { BookTicketDto } from './dto/book-ticket.dto';
import { SeatStatus, ShowtimeSeat } from './entities/showtime-seat.entity';
import { Showtime } from './entities/showtime.entity';
import { TICKET_QUEUE, PROCESS_BOOKING_JOB } from '../../infrastructure/queue/queue.constants';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeSeat)
    private readonly showtimeSeatRepo: Repository<ShowtimeSeat>,
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    private readonly redisService: RedisService,
    @InjectQueue(TICKET_QUEUE) private ticketQueue: Queue,
  ) {}

  // Run this function automatically every 1 minute
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseAbandonedSeats() {
    // 1. Find all seats currently marked as HELD in Postgres
    const heldSeats = await this.showtimeSeatRepo.find({ 
        where: { status: SeatStatus.HELD } 
    });

    for (const seat of heldSeats) {
      // 2. Check if the Redis timer is still active for this seat
      const isLocked = await this.redisService.exists(
          `lock:showtime:${seat.showtimeId}:seat:${seat.seatNumber}`
      );

      // 3. If Redis lock is gone, the user abandoned their cart. Free the seat!
      if (!isLocked) {
        await this.showtimeSeatRepo.update(seat.id, { 
            status: SeatStatus.AVAILABLE, 
            userId: null 
        });
        console.log(`Freed abandoned seat: ${seat.seatNumber} for show ${seat.showtimeId}`);
      }
    }
  }

  private lockKey(showtimeId: string, seatId: string) {
    return `lock:showtime:${showtimeId}:seat:${seatId}`;
  }

  async reserveRequest(dto: BookTicketDto, userId: string) {
    const seat = await this.showtimeSeatRepo.findOne({
      where: {
        showtimeId: dto.showtimeId,
        seatNumber: dto.seatId,
      },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found for this show.');
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new ConflictException('This seat is already held or sold.');
    }

    const success = await this.redisService.tryLockSeat(dto.showtimeId, dto.seatId, userId);
    if (!success) {
      throw new ConflictException('Seat is unavailable at the moment. Please try again later.');
    }

    try {
      await this.showtimeSeatRepo.update(seat.id, {
        status: SeatStatus.HELD,
        userId,
      });
    } catch (error) {
      await this.redisService.unlockSeat(dto.showtimeId, dto.seatId);
      throw error;
    }

    await this.ticketQueue.add(
      PROCESS_BOOKING_JOB,
      {
        ...dto,
        userId,
      },
      {
        attempts: 3,
        backoff: 1000,
      },
    );

    return {
      status: 'pending',
      message: 'Request received. We are processing your ticket!',
    };
  }

  async getSeatMap(showtimeId: string) {
    const seats = await this.showtimeSeatRepo.find({
      where: { showtimeId },
      order: { seatNumber: 'ASC' },
    });

    return await Promise.all(
      seats.map(async (seat) => {
        const isHeld =
          (await this.redisService.exists(this.lockKey(showtimeId, seat.seatNumber))) === 1;
        const status =
          seat.status === SeatStatus.SOLD
            ? 'sold'
            : seat.status === SeatStatus.HELD || isHeld
            ? 'held'
            : 'available';

        return {
          id: seat.id,
          seatNumber: seat.seatNumber,
          section: seat.section,
          type: seat.type,
          status,
        };
      }),
    );
  }

  async getShowtimeList() {
    const showtimes = await this.showtimeRepo.find({ order: { startTime: 'DESC' } });
    return await Promise.all(
      showtimes.map(async (showtime) => {
        const totalSeats = await this.showtimeSeatRepo.count({ where: { showtimeId: showtime.id } });
        const soldSeats = await this.showtimeSeatRepo.count({
          where: { showtimeId: showtime.id, status: SeatStatus.SOLD },
        });
        const heldSeats = await this.showtimeSeatRepo.count({
          where: { showtimeId: showtime.id, status: SeatStatus.HELD },
        });

        return {
          ...showtime,
          totalSeats,
          availableSeats: Math.max(totalSeats - soldSeats - heldSeats, 0),
          soldSeats,
          heldSeats,
        };
      }),
    );
  }

  async getShowtimeById(showtimeId: string) {
    const showtime = await this.showtimeRepo.findOne({ where: { id: showtimeId } });
    if (!showtime) {
      throw new NotFoundException('Showtime not found.');
    }
    const totalSeats = await this.showtimeSeatRepo.count({ where: { showtimeId: showtime.id } });
    const soldSeats = await this.showtimeSeatRepo.count({
      where: { showtimeId: showtime.id, status: SeatStatus.SOLD },
    });
    const heldSeats = await this.showtimeSeatRepo.count({
      where: { showtimeId: showtime.id, status: SeatStatus.HELD },
    });

    return {
      ...showtime,
      totalSeats,
      availableSeats: Math.max(totalSeats - soldSeats - heldSeats, 0),
      soldSeats,
      heldSeats,
    };
  }
}
