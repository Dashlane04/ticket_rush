import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ProjectionType {
  t_d = '2D',
  thr_d = '3D',
  imax = 'IMAX',
}

@Entity('showtimes')
export class Showtime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  movieTitle: string;

  @Column()
  theatreName: string;

  @Column()
  hallName: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  projectionType: string;

  @Column()
  ageRating: string;

  @Column({ default: 0 })
  totalSeats: number;

  @Column({ default: 0 })
  availableSeats: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 8 })
  maxSeatsPerBooking: number;

  @Column({ type: 'text', nullable: true })
  bannerImage: string;

  /** Danh mục hiển thị / lọc trên storefront (đồng bộ với EventFilter). */
  @Column({ default: 'Khác' })
  category: string;

  /** Thời điểm mở bán vé (UTC trong DB); null = không chặn theo thời gian (đã coi như mở bán). */
  @Column({ type: 'timestamptz', nullable: true })
  ticketSaleOpensAt: Date | null;
}
