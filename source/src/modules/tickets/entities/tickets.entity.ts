import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, Unique } from 'typeorm';

@Entity('tickets')
// Unique entry: physically prevents two rows with the same showId + seatId
@Unique(['showtimeId', 'seatId']) 
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // fast lookup for my_tickets feature
  userId: string;

  @Column()
  showtimeId: string;

  @Column()
  seatId: string;

  @Column({ default: 'CONFIRMED' }) // CONFIRMED, CANCELLED, REFUNDED
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('jsonb', { nullable: true })
  metadata: any; // store things like "Hall 4", "VIP Row", etc.

  @CreateDateColumn()
  createdAt: Date;
}