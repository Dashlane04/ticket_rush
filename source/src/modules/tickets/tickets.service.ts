import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
import { Ticket } from './entities/tickets.entity'; // 1. Import Ticket

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeSeat)
    private readonly showtimeSeatRepo: Repository<ShowtimeSeat>,
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly redisService: RedisService,
    @InjectQueue(TICKET_QUEUE) private ticketQueue: Queue,
    
  ) {}

  // Run this function automatically every 1 minute
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseAbandonedSeats() {
    const heldSeats = await this.showtimeSeatRepo.find({ 
        where: { status: SeatStatus.HELD } 
    });

    for (const seat of heldSeats) {
      // ---> THE FIX: Use the standardized lockKey helper! <---
      const currentLockKey = this.lockKey(seat.showtimeId, seat.seatNumber);
      const isLocked = await this.redisService.exists(currentLockKey);

      if (!isLocked) {
        await this.showtimeSeatRepo.update(seat.id, { 
            status: SeatStatus.AVAILABLE, 
            userId: null 
        });
        console.log(`Freed abandoned seat: ${seat.seatNumber} for show ${seat.showtimeId}`);
      }
    }
  }

  async releaseSeatLock(showtimeId: string, seatId: string) {
    // 1. Delete the lock from Redis
    await this.redisService.del(`lock:${showtimeId}:${seatId}`);
    
    // 2. Update the Postgres status back to AVAILABLE
    await this.showtimeSeatRepo.update(
      { showtimeId, seatNumber: seatId },
      { status: SeatStatus.AVAILABLE }
    );
    
    return { success: true };
  }

  private lockKey(showtimeId: string, seatId: string) {
    return `lock:${showtimeId}:${seatId}`; // <--- Standardized!
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

  // --- NEW: Multi-Seat Cart Reservation ---
  async reserveTickets(showtimeId: string, seatIds: string[], userId: string) {
    if (!seatIds || seatIds.length === 0) {
      throw new ConflictException("No seats selected.");
    }

    // 1. Verify all seats are actually available first
    for (const seatId of seatIds) {
      const seat = await this.showtimeSeatRepo.findOne({
        where: { showtimeId, seatNumber: seatId }
      });
      if (!seat || seat.status !== SeatStatus.AVAILABLE) {
        throw new ConflictException(`Seat ${seatId} is no longer available!`);
      }
    }

    // 2. Lock them all in Redis AND PostgreSQL
    for (const seatId of seatIds) {
      const currentLockKey = this.lockKey(showtimeId, seatId);
      
      // Lock in Redis for 5 minutes (300,000 milliseconds)
      await this.redisService.acquireLock(currentLockKey, 300000); 

      // Update Postgres instantly so the Live Radar paints them Orange!
      await this.showtimeSeatRepo.update(
        { showtimeId, seatNumber: seatId },
        { status: SeatStatus.HELD, userId: userId }
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

  // --- NEW: Finalize Purchase ---
  async purchaseTickets(userId: string, showtimeId: string, seatIds: string[]) {
    try {
      if (!seatIds || !Array.isArray(seatIds)) {
        throw new Error("seatIds is missing or not an array!");
      }

      // We will collect all the new tickets here to save them efficiently at the end
      const ticketsToCreate: Ticket[] = [];

      for (const seatId of seatIds) {
        // 1. Fetch the exact seat so we know what type it is (Normal, VIP, Sweetbox)
        const seat = await this.showtimeSeatRepo.findOne({
          where: { showtimeId, seatNumber: seatId }
        });

        if (!seat) throw new Error(`Seat ${seatId} not found in database!`);

        // 2. Determine the price based on the seat type (Matches your blueprint pricing)
        let seatPrice = 15; // Fallback default
        if (seat.type === 'vip') seatPrice = 40;
        if (seat.type === 'sweetbox') seatPrice = 65;

        // 3. Build the official Ticket object
        ticketsToCreate.push(
          this.ticketRepo.create({
            userId: userId,
            showtimeId: showtimeId,
            seatId: seatId,
            status: 'CONFIRMED',  // <--- perfectly matches your entity!
            price: seatPrice
          })
        );

        // 4. Update PostgreSQL Seat Status
        await this.showtimeSeatRepo.update(
          { showtimeId, seatNumber: seatId },
          { status: SeatStatus.SOLD } 
        );
        
        // 5. Clear Redis Lock
        await this.redisService.del(`lock:${showtimeId}:${seatId}`);
      }

      // 6. Save all generated tickets to the database in one batch
      if (ticketsToCreate.length > 0) {
        await this.ticketRepo.save(ticketsToCreate);
      }

      // 7. Keep the Master Showtime counter in sync!
      await this.showtimeRepo.decrement(
        { id: showtimeId },
        'availableSeats',
        seatIds.length
      );

      // 8. The user successfully bought their tickets. Kick them out of the active room
      // so the next person in the virtual queue can immediately enter the seat map!
      await this.leaveQueue(showtimeId, userId);

      return { success: true, message: 'Tickets successfully purchased!' };

    } catch (error) {
      console.error("🔥 CRASH IN PURCHASE ENDPOINT: ", error);
      throw new InternalServerErrorException('Purchase failed: ' + error.message);
    }
  }



  // Configuration: How many people are allowed to view the seat map at once?
  private readonly MAX_ACTIVE_USERS = 2; 

  // --- 1. Join the Queue (Updated) ---
  async joinQueue(showtimeId: string, userId: string) {
    // 1. Record their heartbeat immediately
    // ---> FIX 1: Use Overwrite for heartbeats <---
    await this.redisService.zAddOverwrite(`heartbeats:${showtimeId}`, Date.now(), userId);

    const isActive = await this.redisService.sIsMember(`active:${showtimeId}`, userId);
    if (isActive) return { status: 'ENTER' };

    // Add to waiting room (NX ensures we don't overwrite their spot in line if they refresh!)
    await this.redisService.zAdd(`queue:${showtimeId}`, Date.now(), userId);

    await this.cleanupGhostsAndPromote(showtimeId);
    return this.getQueueStatus(showtimeId, userId);
  }

  // --- 2. Check Queue Status (Updated) ---
  async getQueueStatus(showtimeId: string, userId: string) {
    // 1. Update their heartbeat because they just pinged us!
    // ---> FIX 2: Use Overwrite so the ping actually moves the timestamp forward! <---
    await this.redisService.zAddOverwrite(`heartbeats:${showtimeId}`, Date.now(), userId);

    await this.cleanupGhostsAndPromote(showtimeId);

    const isActive = await this.redisService.sIsMember(`active:${showtimeId}`, userId);
    if (isActive) return { status: 'ENTER' };

    const rank = await this.redisService.zRank(`queue:${showtimeId}`, userId);
    if (rank === null) {
      return { status: 'ERROR', message: 'You lost connection. Please refresh.' };
    }

    return { status: 'WAIT', position: rank + 1 }; 
  }

  // --- 3. Leave the Queue (Updated) ---
  async leaveQueue(showtimeId: string, userId: string) {
    await this.redisService.sRem(`active:${showtimeId}`, userId);
    await this.redisService.zRem(`queue:${showtimeId}`, userId);
    await this.redisService.zRem(`heartbeats:${showtimeId}`, userId); // Clean up heartbeat
    
    await this.cleanupGhostsAndPromote(showtimeId);
    return { success: true };
  }

  // --- NEW: The Sweeper & Promoter with Race-Condition Protection ---
  private async cleanupGhostsAndPromote(showtimeId: string) {
    
    // 1. THE TURNSTILE (Mutex Lock)
    // Tries to grab the lock for 2000 milliseconds (2 seconds)
    const acquiredLock = await this.redisService.acquireLock(`lock:promote:${showtimeId}`, 2000);

    // If false, someone else is currently running this exact function! Abort safely.
    if (!acquiredLock) {
      return; 
    }

    try {
      // 2. Identify Ghosts (Hasn't pinged in 15 seconds)
      const cutoffTime = Date.now() - 15000; 
      const ghosts = await this.redisService.zRangeByScore(`heartbeats:${showtimeId}`, 0, cutoffTime);

      if (ghosts && ghosts.length > 0) {
        await this.redisService.sRem(`active:${showtimeId}`, ...ghosts);
        await this.redisService.zRem(`queue:${showtimeId}`, ...ghosts);
        await this.redisService.zRem(`heartbeats:${showtimeId}`, ...ghosts);
        console.log(`Cleaned up ${ghosts.length} ghost users.`);
      }

      // 3. Promote Users safely
      const activeCount = await this.redisService.sCard(`active:${showtimeId}`);
      const slotsAvailable = this.MAX_ACTIVE_USERS - activeCount;

      if (slotsAvailable > 0) {
        const nextUsers = await this.redisService.zRange(`queue:${showtimeId}`, 0, slotsAvailable - 1);
        
        if (nextUsers.length > 0) {
          await this.redisService.sAdd(`active:${showtimeId}`, ...nextUsers);
          await this.redisService.zRem(`queue:${showtimeId}`, ...nextUsers);
        }
      }
    } finally {
      // 4. UNLOCK THE TURNSTILE
      await this.redisService.del(`lock:promote:${showtimeId}`);
    }
  }

  // --- THE BOUNCER: Promotes users from Queue to Active ---
  private async promoteUsers(showtimeId: string) {
    const activeCount = await this.redisService.sCard(`active:${showtimeId}`);
    const slotsAvailable = this.MAX_ACTIVE_USERS - activeCount;

    if (slotsAvailable > 0) {
      // Grab the top N people who have been waiting the longest
      const nextUsers = await this.redisService.zRange(`queue:${showtimeId}`, 0, slotsAvailable - 1);
      
      if (nextUsers.length > 0) {
        // 1. Move them into the active room
        await this.redisService.sAdd(`active:${showtimeId}`, ...nextUsers);
        // 2. Remove them from the waiting room
        await this.redisService.zRem(`queue:${showtimeId}`, ...nextUsers);
      }
    }
  }

  // --- NEW: Release Redis Locks manually ---
  async releaseLocks(showtimeId: string, seatIds: string[]) {
    try {
      if (!seatIds || seatIds.length === 0) return { success: true };
      
      // Delete the Redis locks for these specific seats
      for (const seatId of seatIds) {
        // Use the exact key format you used in your reserve method
        await this.redisService.del(`lock:${showtimeId}:${seatId}`);
      }
      
      return { success: true, message: 'Locks released successfully.' };
    } catch (error) {
      console.error("Failed to release locks:", error);
      return { success: false, message: 'Failed to release locks.' };
    }
  }
}
