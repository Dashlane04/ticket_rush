import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('template_seats')
export class SeatTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  templateId: string; 

  @Column()
  templateName: string; // <-- Added to match frontend

  @Column()
  hallName: string;

  @Column()
  seatId: string; // <-- Added. Critical because aisles skip numbers!

  @Column()
  rowNumber: number; 

  @Column()
  colNumber: number; 

  @Column()
  type: string; 

  @Column({ default: false })
  isBlocked: boolean; // <-- Added to track Broken/Reserved seats
}