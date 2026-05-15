import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('tickets')
@Unique(['showtimeId', 'seatId'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  showtimeId: string;

  @Column()
  seatId: string;

  @Column({ default: 'CONFIRMED' })
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  qrCodeUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
