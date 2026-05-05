import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

// Adjust these paths to wherever your entities actually live
import { SeatTemplate } from '../../tickets/entities/template-seat.entity';
import { Showtime } from '../../tickets/entities/showtime.entity';
import { ShowtimeSeat } from '../../tickets/entities/showtime-seat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeatTemplate, Showtime, ShowtimeSeat])
  ],
  controllers: [AdminController], // <-- THIS IS THE CRITICAL LINE
  providers: [AdminService],
})
export class AdminModule {}