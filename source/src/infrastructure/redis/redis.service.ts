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
    /*
    * .key: The specific "showId_seatId" ID (ex: lock:show:12:seat:A1).
    * .userId: user's identifier for the lock 
    * .'EX' (Expire): tells redis to open a timer for this lock
    * .expireTime: the duration of that timer (ex: 600 for 10 minutes)
    * .'NX' (Not Exists): only creates this key if not exists
    *
    */
    // 'OK' = set, null = already exists
    const result = await this.redis.set(key, userId, 'EX', expireTime, 'NX');
    
    return result === 'OK';
  }

  async unlockSeat(showtimeId: string, seatId: string): Promise<void> {
    const key = `lock:showtime:${showtimeId}:seat:${seatId}`;
    await this.redis.del(key);
  }

  async exists(lockKey: string): Promise<number>{
    return await this.redis.exists(lockKey);
  }
}