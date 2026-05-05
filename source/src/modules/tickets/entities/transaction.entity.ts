import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, Unique } from 'typeorm';

@Entity('booking_transactions')
export class BookingTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string; // links to Ticket

  @Column()
  paymentProviderId: string; // provider: Stripe/PayPal ID

  @Column()
  status: string; // PENDING, COMPLETED, FAILED

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}