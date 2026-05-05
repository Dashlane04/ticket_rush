// src/modules/showtime/entities/showtime.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum ProjectionType {
  t_d = '2D',
  thr_d = '3D',  
  imax = 'IMAX'     
}

@Entity('showtimes')
export class Showtime {
  @PrimaryGeneratedColumn('uuid') // different ids even for the same films/shows but different times
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
  projectionType: string; // e.g., "2D", "3D", "IMAX"

  @Column()
  ageRating: string; // e.g., "T16"

  // Better to store as numbers so you can calculate percentages/availability
  @Column({ default: 0 })
  totalSeats: number;

  @Column({ default: 0 })
  availableSeats: number;
}