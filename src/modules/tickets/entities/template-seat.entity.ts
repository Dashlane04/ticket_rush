import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('template_seats')
export class SeatTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  templateId: string;

  @Column()
  templateName: string;

  @Column()
  hallName: string;

  @Column()
  seatId: string;

  @Column()
  rowNumber: number;

  @Column()
  colNumber: number;

  @Column()
  type: string;

  @Column({ default: false })
  isBlocked: boolean;
}
