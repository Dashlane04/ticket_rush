import { Module } from '@nestjs/common';
import { KeycloakModule } from './keycloak/keycloak.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    KeycloakModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
