import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  VersionColumn,
} from 'typeorm';

export enum SeatStatus {
  UNAVAILABLE = 'unavailable',
  AVAILABLE = 'available',
  HELD = 'held',
  SOLD = 'sold',
}

export type SeatType = 'normal' | 'vip' | 'sweetbox';

@Entity('showtime_seats')
@Unique(['showtimeId', 'seatNumber'])
export class ShowtimeSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  showtimeId: string;

  @Column()
  seatNumber: string;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column()
  section: 'left' | 'center' | 'right';

  @Column()
  type: 'normal' | 'vip' | 'sweetbox';

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @VersionColumn()
  version: number;

  @Column({ type: 'int', nullable: true })
  rowNumber: number;

  @Column({ type: 'int', nullable: true })
  colNumber: number;
}
