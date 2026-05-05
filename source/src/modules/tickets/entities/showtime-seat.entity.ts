import { Entity, PrimaryGeneratedColumn, Column, Index, Unique, VersionColumn } from 'typeorm';

export enum SeatStatus {
  AVAILABLE = 'available',
  HELD = 'held',    // in someone's basket/Redis lock sequence
  SOLD = 'sold'     // ticket officially generated
}

export type SeatType = 'normal' | 'vip' | 'sweetbox';

@Entity('showtime_seats')
@Unique(['showtimeId', 'seatNumber']) // Safety: No duplicate seat records for one show
export class ShowtimeSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  showtimeId: string;

  @Column()
  seatNumber: string; // e.g., "A1", "B12"

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column()
  section: 'left' | 'center' | 'right'; // Matches your grid

  @Column()
  type: 'normal' | 'vip' | 'sweetbox'; // Used for color schemes

 @Column({ type: 'varchar', nullable: true })
  userId: string | null; // Tracks who is currently holding/buying it

  // OPTIONAL: Optimistic Locking
  // If you want a 4th layer of safety, TypeORM handles this automatically
  @VersionColumn()
  version: number;
}