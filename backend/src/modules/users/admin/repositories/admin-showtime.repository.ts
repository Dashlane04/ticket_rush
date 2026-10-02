import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';

import { ShowtimeSeat, SeatStatus } from 'src/modules/tickets/entities/showtime-seat.entity';
import { Showtime } from 'src/modules/tickets/entities/showtime.entity';

/**
 * Showtime + ghế showtime trong luồng admin — gom truy vấn TypeORM một chỗ.
 */
@Injectable()
export class AdminShowtimeRepository {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(ShowtimeSeat)
    private readonly seatRepo: Repository<ShowtimeSeat>,
  ) {}

  findAllOrdered(): Promise<Showtime[]> {
    return this.showtimeRepo.find({ order: { startTime: 'DESC' } });
  }

  findById(id: string): Promise<Showtime | null> {
    return this.showtimeRepo.findOne({ where: { id } });
  }

  save(showtime: Showtime): Promise<Showtime> {
    return this.showtimeRepo.save(showtime);
  }

  createInTransaction(
    manager: EntityManager,
    data: DeepPartial<Showtime>,
  ): Promise<Showtime> {
    const entity = manager.create(Showtime, data);
    return manager.save(entity);
  }

  async deleteWithSeatsInTransaction(
    manager: EntityManager,
    id: string,
  ): Promise<number> {
    await manager.delete(ShowtimeSeat, { showtimeId: id });
    const result = await manager.delete(Showtime, { id });
    return result.affected ?? 0;
  }

  async deleteSeatsByShowtimeId(showtimeId: string): Promise<void> {
    await this.seatRepo.delete({ showtimeId });
  }

  saveSeatBatch(seats: ShowtimeSeat[]): Promise<ShowtimeSeat[]> {
    return this.seatRepo.save(seats);
  }

  createSeatBatch(data: DeepPartial<ShowtimeSeat>[]): ShowtimeSeat[] {
    return this.seatRepo.create(data);
  }

  async updateSeatStatus(
    showtimeId: string,
    seatNumber: string,
    status: SeatStatus,
  ): Promise<void> {
    await this.seatRepo.update({ showtimeId, seatNumber }, { status });
  }
}
