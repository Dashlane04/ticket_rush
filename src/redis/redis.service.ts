import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import Redis from "ioredis";
import redisConfig from "src/configs/redis.config";

type RedisConfig = ConfigType<typeof redisConfig>;

@Injectable()

export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis

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
    this.client.on("connect", () => console.log("redis connected"))
    this.client.on("error", (err) => console.log("redis error", err))
    this.client.on("reconnecting", () => console.log("redis reconnecting"))
  }

  onModuleDestroy() {
    this.client.quit()
  }

  async get(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null
  }

  async set(key: string, value: any, ttl?: number) {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), "EX", ttl)
    } else {
      await this.client.set(key, JSON.stringify(value))
    }
  }

  async del(key: string | string[]) {
    const keys = Array.isArray(key) ? key : [key];
    await this.client.del(...keys);
  }

}