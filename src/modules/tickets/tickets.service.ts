import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  TICKET_QUEUE,
  PROCESS_BOOKING_JOB,
} from 'src/infrastructure/queue/queue.constants';
import { RedisService } from 'src/redis/redis.service';
import { BookTicketDto } from './dto/book-ticket.dto';
import { SeatStatus, ShowtimeSeat } from './entities/showtime-seat.entity';
import { Showtime } from './entities/showtime.entity';
import { Ticket } from './entities/tickets.entity';
import { PromoCode } from './entities/promo-code.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeSeat)
    private readonly showtimeSeatRepo: Repository<ShowtimeSeat>,
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(PromoCode)
    private readonly promoCodeRepo: Repository<PromoCode>,
    private readonly redisService: RedisService,
    @InjectQueue(TICKET_QUEUE) private ticketQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseAbandonedSeats() {
    const heldSeats = await this.showtimeSeatRepo.find({
      where: { status: SeatStatus.HELD },
    });

    for (const seat of heldSeats) {
      const currentLockKey = this.lockKey(seat.showtimeId, seat.seatNumber);
      const isLocked = await this.redisService.exists(currentLockKey);

      if (!isLocked) {
        await this.showtimeSeatRepo.update(seat.id, {
          status: SeatStatus.AVAILABLE,
          userId: null,
        });
        console.log(
          `Freed abandoned seat: ${seat.seatNumber} for show ${seat.showtimeId}`,
        );
      }
    }
  }

  async releaseSeatLock(showtimeId: string, seatId: string) {
    await this.redisService.del(`lock:${showtimeId}:${seatId}`);

    await this.showtimeSeatRepo.update(
      { showtimeId, seatNumber: seatId },
      { status: SeatStatus.AVAILABLE },
    );

    return { success: true };
  }

  private lockKey(showtimeId: string, seatId: string) {
    return `lock:${showtimeId}:${seatId}`;
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

    const success = await this.redisService.tryLockSeat(
      dto.showtimeId,
      dto.seatId,
      userId,
    );
    if (!success) {
      throw new ConflictException(
        'Seat is unavailable at the moment. Please try again later.',
      );
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

  async reserveTickets(showtimeId: string, seatIds: string[], userId: string) {
    if (!seatIds || seatIds.length === 0) {
      throw new ConflictException('No seats selected.');
    }

    for (const seatId of seatIds) {
      const seat = await this.showtimeSeatRepo.findOne({
        where: { showtimeId, seatNumber: seatId },
      });
      if (!seat || seat.status !== SeatStatus.AVAILABLE) {
        throw new ConflictException(`Seat ${seatId} is no longer available!`);
      }
    }

    for (const seatId of seatIds) {
      const currentLockKey = this.lockKey(showtimeId, seatId);

      await this.redisService.acquireLock(currentLockKey, 300000);

      await this.showtimeSeatRepo.update(
        { showtimeId, seatNumber: seatId },
        { status: SeatStatus.HELD, userId: userId },
      );
    }

    return { success: true, message: 'Seats successfully locked for checkout.' };
  }

  async getSeatMap(showtimeId: string) {
    const seats = await this.showtimeSeatRepo.find({
      where: { showtimeId },
      order: { seatNumber: 'ASC' },
    });

    return await Promise.all(
      seats.map(async (seat) => {
        const isHeld =
          (await this.redisService.exists(
            this.lockKey(showtimeId, seat.seatNumber),
          )) === 1;
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
          rowNumber: seat.rowNumber,
          colNumber: seat.colNumber,
          price: seat.price,
        };
      }),
    );
  }

  async getShowtimeList() {
    const showtimes = await this.showtimeRepo.find({
      order: { startTime: 'DESC' },
    });
    return await Promise.all(
      showtimes.map(async (showtime) => {
        const totalSeats = await this.showtimeSeatRepo.count({
          where: { showtimeId: showtime.id },
        });
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
    const showtime = await this.showtimeRepo.findOne({
      where: { id: showtimeId },
    });
    if (!showtime) {
      throw new NotFoundException('Showtime not found.');
    }
    const totalSeats = await this.showtimeSeatRepo.count({
      where: { showtimeId: showtime.id },
    });
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

  async getTicketsForUser(userId: string) {
    const tickets = await this.ticketRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const showtimeIds = [...new Set(tickets.map((t) => t.showtimeId))];
    const showtimes =
      showtimeIds.length > 0
        ? await this.showtimeRepo.find({ where: { id: In(showtimeIds) } })
        : [];
    const byId = new Map(showtimes.map((s) => [s.id, s]));
    return tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      showtimeId: t.showtimeId,
      seatId: t.seatId,
      status: t.status,
      price: t.price,
      createdAt: t.createdAt,
      qrCodeUrl: t.qrCodeUrl,
      showtime: byId.get(t.showtimeId) ?? null,
    }));
  }

  async getTicketForUser(userId: string, ticketId: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, userId },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }
    const showtime = await this.showtimeRepo.findOne({
      where: { id: ticket.showtimeId },
    });
    return {
      id: ticket.id,
      userId: ticket.userId,
      showtimeId: ticket.showtimeId,
      seatId: ticket.seatId,
      status: ticket.status,
      price: ticket.price,
      createdAt: ticket.createdAt,
      qrCodeUrl: ticket.qrCodeUrl,
      showtime: showtime ?? null,
    };
  }

  async validatePromoCode(code: string) {
    const codeUpper = code.toUpperCase();
    const promo = await this.promoCodeRepo.findOne({ where: { code: codeUpper } });
    if (!promo) throw new NotFoundException('Promo code not found');
    if (!promo.isActive) throw new ConflictException('Promo code is inactive');
    if (promo.validUntil && new Date() > promo.validUntil) throw new ConflictException('Promo code expired');
    if (promo.maxUses && promo.currentUses >= promo.maxUses) throw new ConflictException('Promo code usage limit reached');
    return { discountPercent: promo.discountPercent };
  }

  async purchaseTickets(userId: string, showtimeId: string, seatIds: string[], promoCode?: string) {
    try {
      if (!seatIds || !Array.isArray(seatIds)) {
        throw new Error('seatIds is missing or not an array!');
      }

      const ticketsToCreate: Ticket[] = [];
      let discountPercent = 0;
      let appliedPromo: PromoCode | null = null;

      if (promoCode) {
        const codeUpper = promoCode.toUpperCase();
        appliedPromo = await this.promoCodeRepo.findOne({ where: { code: codeUpper } });
        if (appliedPromo && appliedPromo.isActive && 
           (!appliedPromo.validUntil || new Date() <= appliedPromo.validUntil) && 
           (!appliedPromo.maxUses || appliedPromo.currentUses < appliedPromo.maxUses)) {
          discountPercent = appliedPromo.discountPercent;
        } else {
          throw new ConflictException('Invalid or expired promo code');
        }
      }

      for (const seatId of seatIds) {
        const seat = await this.showtimeSeatRepo.findOne({
          where: { showtimeId, seatNumber: seatId },
        });

        if (!seat) {
          throw new ConflictException(`Seat ${seatId} not found in database!`);
        }

        if (seat.status !== SeatStatus.HELD) {
          throw new ConflictException(
            `Seat ${seatId} is not held for checkout.`,
          );
        }
        if (seat.userId !== userId) {
          throw new ForbiddenException(
            `Seat ${seatId} is held by another account.`,
          );
        }

        let seatPrice = seat.price ?? 15.0;
        if (discountPercent > 0) {
          seatPrice = seatPrice * (1 - discountPercent / 100);
        }

        ticketsToCreate.push(
          this.ticketRepo.create({
            userId: userId,
            showtimeId: showtimeId,
            seatId: seatId,
            status: 'CONFIRMED',
            price: seatPrice,
          }),
        );

        await this.showtimeSeatRepo.update(
          { showtimeId, seatNumber: seatId },
          { status: SeatStatus.SOLD },
        );

        await this.redisService.del(`lock:${showtimeId}:${seatId}`);
      }

      if (ticketsToCreate.length > 0) {
        const savedTickets = await this.ticketRepo.save(ticketsToCreate);
        for (const t of savedTickets) {
          t.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`TicketRush:${t.id.toUpperCase()}`)}`;
        }
        await this.ticketRepo.save(savedTickets);
      }

      if (appliedPromo) {
        await this.promoCodeRepo.increment({ id: appliedPromo.id }, 'currentUses', 1);
      }

      await this.showtimeRepo.decrement(
        { id: showtimeId },
        'availableSeats',
        seatIds.length,
      );

      await this.leaveQueue(showtimeId, userId);

      return { success: true, message: 'Tickets successfully purchased!' };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('🔥 CRASH IN PURCHASE ENDPOINT: ', error);
      const message =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException('Purchase failed: ' + message);
    }
  }

  private readonly MAX_ACTIVE_USERS = 2;

  async joinQueue(showtimeId: string, userId: string) {
    await this.redisService.zAddOverwrite(
      `heartbeats:${showtimeId}`,
      Date.now(),
      userId,
    );

    const isActive = await this.redisService.sIsMember(
      `active:${showtimeId}`,
      userId,
    );
    if (isActive) return { status: 'ENTER' };

    await this.redisService.zAdd(`queue:${showtimeId}`, Date.now(), userId);

    await this.cleanupGhostsAndPromote(showtimeId);
    return this.getQueueStatus(showtimeId, userId);
  }

  async getQueueStatus(showtimeId: string, userId: string) {
    await this.redisService.zAddOverwrite(
      `heartbeats:${showtimeId}`,
      Date.now(),
      userId,
    );

    await this.cleanupGhostsAndPromote(showtimeId);

    const isActive = await this.redisService.sIsMember(
      `active:${showtimeId}`,
      userId,
    );
    if (isActive) return { status: 'ENTER' };

    const rank = await this.redisService.zRank(`queue:${showtimeId}`, userId);
    if (rank === null) {
      return {
        status: 'ERROR',
        message: 'You lost connection. Please refresh.',
      };
    }

    return { status: 'WAIT', position: rank + 1 };
  }

  async leaveQueue(showtimeId: string, userId: string) {
    await this.redisService.sRem(`active:${showtimeId}`, userId);
    await this.redisService.zRem(`queue:${showtimeId}`, userId);
    await this.redisService.zRem(`heartbeats:${showtimeId}`, userId);

    await this.cleanupGhostsAndPromote(showtimeId);
    return { success: true };
  }

  private async cleanupGhostsAndPromote(showtimeId: string) {
    const acquiredLock = await this.redisService.acquireLock(
      `lock:promote:${showtimeId}`,
      2000,
    );

    if (!acquiredLock) {
      return;
    }

    try {
      const cutoffTime = Date.now() - 90000;
      const ghosts = await this.redisService.zRangeByScore(
        `heartbeats:${showtimeId}`,
        0,
        cutoffTime,
      );

      if (ghosts && ghosts.length > 0) {
        await this.redisService.sRem(`active:${showtimeId}`, ...ghosts);
        await this.redisService.zRem(`queue:${showtimeId}`, ...ghosts);
        await this.redisService.zRem(`heartbeats:${showtimeId}`, ...ghosts);
        console.log(`Cleaned up ${ghosts.length} ghost users.`);
      }

      const activeCount = await this.redisService.sCard(`active:${showtimeId}`);
      const slotsAvailable = this.MAX_ACTIVE_USERS - activeCount;

      if (slotsAvailable > 0) {
        const nextUsers = await this.redisService.zRange(
          `queue:${showtimeId}`,
          0,
          slotsAvailable - 1,
        );

        if (nextUsers.length > 0) {
          await this.redisService.sAdd(`active:${showtimeId}`, ...nextUsers);
          await this.redisService.zRem(`queue:${showtimeId}`, ...nextUsers);
        }
      }
    } finally {
      await this.redisService.del(`lock:promote:${showtimeId}`);
    }
  }

  async releaseLocks(
    showtimeId: string,
    seatIds: string[],
    userId: string,
  ) {
    if (!seatIds || seatIds.length === 0) {
      return { success: true, message: 'Locks released successfully.' };
    }

    for (const seatId of seatIds) {
      const seat = await this.showtimeSeatRepo.findOne({
        where: { showtimeId, seatNumber: seatId },
      });
      if (!seat) {
        continue;
      }
      if (seat.userId !== userId) {
        throw new ForbiddenException(
          `Cannot release seat ${seatId} reserved by another user.`,
        );
      }
      if (seat.status !== SeatStatus.HELD) {
        continue;
      }

      await this.redisService.del(this.lockKey(showtimeId, seatId));
      await this.showtimeSeatRepo.update(
        { showtimeId, seatNumber: seatId },
        { status: SeatStatus.AVAILABLE, userId: null },
      );
    }

    return { success: true, message: 'Locks released successfully.' };
  }

  async recordPing(sessionId: string) {
    await this.redisService.zAddOverwrite('active_users', Date.now(), sessionId);
    return { success: true };
  }
}
