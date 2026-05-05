import { Module, Global } from '@nestjs/common';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './redis.service';

@Global() // makes RedisService available everywhere without re-importing
@Module({
  imports: [
    IoRedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}