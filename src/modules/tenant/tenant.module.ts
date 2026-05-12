import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './entity/tenant.entity';
import { TenantService } from './tenant.service';
import { TenantRepository } from './tenant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
  controllers: [TenantController],
  providers: [TenantService, TenantRepository],
  exports: [],
})
export class TenantModule {}
