import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('booking_transactions')
export class BookingTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  paymentProviderId: string;

  @Column()
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
