// src/modules/users/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';

import { Showtime } from 'src/modules/tickets/entities/showtime.entity';
import { ShowtimeSeat, SeatStatus } from 'src/modules/tickets/entities/showtime-seat.entity';
import { SeatTemplate } from 'src/modules/tickets/entities/template-seat.entity';
import type { SeatType } from 'src/modules/tickets/entities/showtime-seat.entity';
import { SaveSeatTemplateDto } from './dto/save-seat-template.dto';
import { CreateShowtimeDto } from './dto/create-showtime.dto';

@Injectable()
export class AdminService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SeatTemplate)
    private readonly seatTemplateRepo: Repository<SeatTemplate>,
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(ShowtimeSeat)
    private readonly showtimeSeatRepo: Repository<ShowtimeSeat>,
  ) {}

  async createShowtime(dto: CreateShowtimeDto) {
    return await this.dataSource.transaction(async (manager) => {
      const start = new Date(dto.startTime);
      const durationMinutes = dto.durationMinutes ?? 120;
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const cols = dto.cols;
      const totalSeats = dto.rows * cols;

      const showtime = manager.create(Showtime, {
        movieTitle: dto.movieTitle,
        startTime: start,
        endTime: end,
        theatreName: dto.theatreName ?? 'Main Theatre',
        hallName: dto.hallName ?? 'Main Hall',
        projectionType: dto.projectionType ?? '2D',
        ageRating: dto.ageRating ?? 'T16',
        totalSeats,
        availableSeats: totalSeats,
      });

      const savedShow = await manager.save(showtime);

      const seats: ShowtimeSeat[] = [];
      for (let rowIndex = 0; rowIndex < dto.rows; rowIndex++) {
        const rowChar = String.fromCharCode(65 + rowIndex);
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          seats.push(
            manager.create(ShowtimeSeat, {
              showtimeId: savedShow.id,
              seatNumber: `${rowChar}${colIndex + 1}`,
              status: SeatStatus.AVAILABLE,
              section: this.getSection(colIndex, cols),
              type: 'normal' as SeatType,
            }),
          );
        }
      }

      await manager.insert(ShowtimeSeat, seats);
      return savedShow;
    });
  }

  async saveSeatTemplate(dto: SaveSeatTemplateDto) {
    return await this.dataSource.transaction(async (manager) => {
      const templateId = randomUUID();
      const templateName = dto.templateName ?? 'Default Layout';
      const hallName = dto.hallName ?? 'Main Hall';

      const seats = dto.layout.map((seat) => ({
        templateId,
        templateName,
        hallName,
        seatId: seat.id, // <-- Capture the exact frontend ID
        rowNumber: seat.gridRow,
        colNumber: seat.gridCol,
        type: seat.type,
        isBlocked: seat.isBlocked
      }));

      await manager.insert(SeatTemplate, seats);
      return { templateId, templateName, savedSeats: seats.length };
    });
  }

  async applyTemplateToShowtime(showtimeId: string, templateId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const templateSeats = await manager.find(SeatTemplate, { where: { templateId } });
      if (!templateSeats.length) return { updatedSeats: 0 };

      const seatUpdates = templateSeats.map(async (templateSeat) => {
        return manager.update(
          ShowtimeSeat,
          { showtimeId, seatNumber: templateSeat.seatId }, // Map exactly to custom ID
          {
            type: templateSeat.type as any,
            section: this.getSection(templateSeat.colNumber, 22), // Hardcoded 22 based on your UI, should ideally be dynamic
            // If the admin blocked it, mark it SOLD so users can't click it
            status: templateSeat.isBlocked ? SeatStatus.SOLD : SeatStatus.AVAILABLE 
          },
        );
      });

      await Promise.all(seatUpdates);
      return { updatedSeats: templateSeats.length };
    });
  }

  async getSeatTemplates() {
    const templates = await this.seatTemplateRepo
      .createQueryBuilder('st')
      .select(['st.templateId', 'st.templateName', 'st.hallName'])
      .distinct(true)
      .getRawMany();

    return templates.map((row) => ({
      templateId: row.st_templateId,
      templateName: row.st_templateName,
      hallName: row.st_hallName,
    }));
  }

  private getSection(col: number, totalCols: number): 'left' | 'center' | 'right' {
    if (col < 4) return 'right';
    if (col >= totalCols - 4) return 'left';
    return 'center';
  }

  async getShowtimes() {
    return await this.showtimeRepo.find({ order: { startTime: 'DESC' } });
  }
}
