import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from 'src/configs/redis.config';

type RedisConfig = ConfigType<typeof redisConfig>;

/**
 * Mot Redis server / mot client trong app Nest: refresh token + cache user/auth + ve (lock, sorted set...).
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: RedisConfig,
  ) {
    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      retryStrategy: (times) => Math.min(times * 500, 5000),
      maxRetriesPerRequest: 3,
    });
  }

  onModuleInit() {
    this.client.on('connect', () => console.log('redis connected'));
    this.client.on('error', (err) => console.log('redis error', err));
    this.client.on('reconnecting', () => console.log('redis reconnecting'));
  }

  onModuleDestroy() {
    this.client.quit();
  }

  /** Cache JSON (user / auth). Key khac namespace voi ve (lock:, queue:, ...). */
  async get(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: unknown, ttl?: number) {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async del(key: string | string[]) {
    const keys = Array.isArray(key) ? key : [key];
    await this.client.del(...keys);
  }

  /** Đặt chỗ vé / mutex / virtual queue — cùng hành vi với concur `RedisService` trước khi gộp. */
  async tryLockSeat(
    showtimeId: string,
    seatId: string,
    userId: string,
  ): Promise<boolean> {
    const redisKey = `lock:showtime:${showtimeId}:seat:${seatId}`;
    const expireSec = 600;
    const result = await this.client.set(
      redisKey,
      userId,
      'EX',
      expireSec,
      'NX',
    );
    return result === 'OK';
  }

  async unlockSeat(showtimeId: string, seatId: string): Promise<void> {
    await this.client.del(`lock:showtime:${showtimeId}:seat:${seatId}`);
  }

  async exists(lockKey: string): Promise<number> {
    return this.client.exists(lockKey);
  }

  async acquireLock(key: string, ttlMilliseconds: number): Promise<boolean> {
    const result = await this.client.set(
      key,
      'locked',
      'PX',
      ttlMilliseconds,
      'NX',
    );
    return result === 'OK';
  }

  async sAdd(key: string, ...members: string[]) {
    return this.client.sadd(key, ...members);
  }

  async sRem(key: string, ...members: string[]) {
    return this.client.srem(key, ...members);
  }

  async sIsMember(key: string, member: string) {
    return this.client.sismember(key, member);
  }

  async sCard(key: string) {
    return this.client.scard(key);
  }

  async zAdd(key: string, score: number, member: string) {
    return this.client.zadd(key, 'NX', score, member);
  }

  async zRank(key: string, member: string) {
    return this.client.zrank(key, member);
  }

  async zRange(key: string, start: number, stop: number) {
    return this.client.zrange(key, start, stop);
  }

  async zRem(key: string, ...members: string[]) {
    return this.client.zrem(key, ...members);
  }

  async zRangeByScore(key: string, min: number, max: number) {
    return this.client.zrangebyscore(key, min, max);
  }

  async zAddOverwrite(key: string, score: number, member: string) {
    return this.client.zadd(key, score, member);
  }

  async zRemRangeByScore(key: string, min: number, max: number) {
    return this.client.zremrangebyscore(key, min, max);
  }

  async keys(pattern: string) {
    return this.client.keys(pattern);
  }
}
