import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * tries to lock a seat for a specific amount of time.
   * -> returns true if user successfully acquired the seat.
   */
  async tryLockSeat(showtimeId: string, seatId: string, userId: string): Promise<boolean> {
    const key = `lock:showtime:${showtimeId}:seat:${seatId}`;
    const expireTime = 600; // 10 minutes in seconds

    // SETNX + EXPIRE in one atomic command
    // 'OK' = set, null = already exists
    const result = await this.redis.set(key, userId, 'EX', expireTime, 'NX');
    
    return result === 'OK';
  }

  async unlockSeat(showtimeId: string, seatId: string): Promise<void> {
    const key = `lock:showtime:${showtimeId}:seat:${seatId}`;
    await this.redis.del(key);
  }
}