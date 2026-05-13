import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeatTemplate } from 'src/modules/tickets/entities/template-seat.entity';
import { Showtime } from 'src/modules/tickets/entities/showtime.entity';
import { ShowtimeSeat } from 'src/modules/tickets/entities/showtime-seat.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSeatTemplateRepository } from './repositories/admin-seat-template.repository';
import { AdminShowtimeRepository } from './repositories/admin-showtime.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeatTemplate, Showtime, ShowtimeSeat]),
  ],
  controllers: [AdminController],
  providers: [
    AdminShowtimeRepository,
    AdminSeatTemplateRepository,
    AdminService,
  ],
})
export class AdminModule {}
