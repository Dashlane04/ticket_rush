import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimeSeat, SeatStatus } from './showtime-seat.entity';

@Injectable()
export class ShowtimeService {
  constructor(
    @InjectRepository(ShowtimeSeat)
    private readonly showtimeSeatRepo: Repository<ShowtimeSeat>,
  ) {}

  /**
   * Batch creates seats for a show. 
   * Call this when an admin creates a new showtime.
   */
  async createShowtimeWithSeats(showtimeId: string, rows: number, colsPerRows: number) {
    const seats: ShowtimeSeat[] = [];

    // 1. Generate seat list in memory
    for (let i = 0; i < rows; i++) {
      const rowLetter = String.fromCharCode(65 + i); // 65 = 'A'
      for (let j = 1; j <= colsPerRows; j++) {
        const seat = new ShowtimeSeat();
        seat.showtimeId = showtimeId;
        seat.seatNumber = `${rowLetter}${j}`; // 'A1', 'A2'...
        seat.status = SeatStatus.AVAILABLE;
        seats.push(seat);
      }
    }

    // 2. Batch Insert 
    // insert() is much faster than save() for large arrays.
    await this.showtimeSeatRepo.insert(seats);
    
    return { message: `Successfully seeded ${seats.length} seats.` };
  }
}