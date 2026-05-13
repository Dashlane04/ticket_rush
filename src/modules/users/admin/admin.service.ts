import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, DeepPartial } from 'typeorm';

import { ShowtimeSeat, SeatStatus } from 'src/modules/tickets/entities/showtime-seat.entity';
import type { SeatType } from 'src/modules/tickets/entities/showtime-seat.entity';
import { SeatTemplate } from 'src/modules/tickets/entities/template-seat.entity';
import { RedisService } from 'src/redis/redis.service';

import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { SaveSeatTemplateDto } from './dto/save-seat-template.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { AdminSeatTemplateRepository } from './repositories/admin-seat-template.repository';
import { AdminShowtimeRepository } from './repositories/admin-showtime.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly showtimeRepo: AdminShowtimeRepository,
    private readonly templateRepo: AdminSeatTemplateRepository,
    private readonly redisService: RedisService,
  ) {}

  async createShowtime(dto: CreateShowtimeDto) {
    return await this.dataSource.transaction(async (manager) => {
      const start = new Date(dto.startTime);
      const durationMinutes = dto.durationMinutes ?? 120;
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const totalSeats = dto.rows * dto.cols;
      const ticketSaleOpensAt =
        dto.ticketSaleOpensAt !== undefined && dto.ticketSaleOpensAt !== ''
          ? new Date(dto.ticketSaleOpensAt)
          : null;

      return this.showtimeRepo.createInTransaction(manager, {
        movieTitle: dto.movieTitle,
        description: dto.description,
        bannerImage: dto.bannerImage,
        startTime: start,
        endTime: end,
        theatreName: dto.theatreName ?? 'Main Theatre',
        hallName: dto.hallName ?? 'Main Hall',
        projectionType: dto.projectionType ?? '2D',
        ageRating: dto.ageRating ?? 'T16',
        category: dto.category?.trim() || 'Khác',
        ticketSaleOpensAt,
        totalSeats,
        availableSeats: totalSeats,
      });
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
        seatId: seat.id,
        rowNumber: seat.gridRow,
        colNumber: seat.gridCol,
        type: seat.type,
        isBlocked: seat.isBlocked,
      }));

      await this.templateRepo.insertMany(manager, seats);
      return { templateId, templateName, savedSeats: seats.length };
    });
  }

  /**
   * Chi tiết template cho editor + các chỗ chỉ cần hall/dimensions (apply-template flow).
   */
  async getTemplateDetails(templateId: string) {
    const seats = await this.templateRepo.findByTemplateId(templateId);

    if (!seats || seats.length === 0) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const rows = Math.max(...seats.map((s) => s.rowNumber)) + 1;
    const columns = Math.max(...seats.map((s) => s.colNumber)) + 1;

    const layout = seats.map((s) => ({
      id: s.seatId,
      gridRow: s.rowNumber,
      gridCol: s.colNumber,
      type: s.type,
      isBlocked: s.isBlocked,
    }));

    return {
      templateId,
      templateName: seats[0].templateName,
      hallName: seats[0].hallName,
      dimensions: {
        rows,
        columns,
      },
      layout,
    };
  }

  /** Thay toàn bộ ghế của một template (transaction). */
  async replaceSeatTemplate(templateId: string, dto: SaveSeatTemplateDto) {
    const existing = await this.templateRepo.findByTemplateId(templateId);
    if (!existing?.length) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.delete(SeatTemplate, { templateId });

      const templateName = dto.templateName ?? existing[0].templateName;
      const hallName = dto.hallName ?? existing[0].hallName;

      const seats = dto.layout.map((seat) => ({
        templateId,
        templateName,
        hallName,
        seatId: seat.id,
        rowNumber: seat.gridRow,
        colNumber: seat.gridCol,
        type: seat.type,
        isBlocked: seat.isBlocked,
      }));

      await this.templateRepo.insertMany(manager, seats);
      return { templateId, templateName, savedSeats: seats.length };
    });
  }

  async applyTemplateToShowtime(showtimeId: string, templateId: string) {
    const templateSeats = await this.templateRepo.findByTemplateId(templateId);

    if (!templateSeats || templateSeats.length === 0) {
      throw new Error(`Template ${templateId} has no seats configured.`);
    }

    await this.showtimeRepo.deleteSeatsByShowtimeId(showtimeId);

    const seatsData = templateSeats.map((ts) => ({
      showtimeId,
      showtime: { id: showtimeId },
      seatNumber: ts.seatId,
      type: ts.type as SeatType,
      status: ts.isBlocked ? SeatStatus.UNAVAILABLE : SeatStatus.AVAILABLE,
      section: 'center' as const,
      rowNumber: ts.rowNumber,
      colNumber: ts.colNumber,
    }));

    const showtimeSeatsToInsert = this.showtimeRepo.createSeatBatch(
      seatsData as DeepPartial<ShowtimeSeat>[],
    );

    await this.showtimeRepo.saveSeatBatch(showtimeSeatsToInsert);

    return { success: true, seatsGenerated: showtimeSeatsToInsert.length };
  }

  async getSeatTemplates() {
    return this.templateRepo.findDistinctSummaries();
  }

  async deleteSeatTemplate(templateId: string) {
    const result = await this.templateRepo.deleteByTemplateId(templateId);

    if (result.affected === 0) {
      throw new NotFoundException('Template not found');
    }
    return { success: true, message: 'Template deleted successfully' };
  }

  async getShowtimes() {
    return this.showtimeRepo.findAllOrdered();
  }

  async getShowtimeById(id: string) {
    const showtime = await this.showtimeRepo.findById(id);
    if (!showtime) throw new NotFoundException('Showtime not found');
    return showtime;
  }

  async updateShowtime(id: string, dto: UpdateShowtimeDto) {
    const showtime = await this.showtimeRepo.findById(id);
    if (!showtime) throw new NotFoundException('Showtime not found');

    if (dto.movieTitle !== undefined) showtime.movieTitle = dto.movieTitle;
    if (dto.description !== undefined) showtime.description = dto.description;
    if (dto.bannerImage !== undefined) showtime.bannerImage = dto.bannerImage;

    if (dto.startTime !== undefined) {
      const newStart = new Date(dto.startTime);
      const durationMs =
        showtime.endTime.getTime() - showtime.startTime.getTime();
      showtime.startTime = newStart;
      showtime.endTime = new Date(newStart.getTime() + durationMs);
    }

    if (dto.category !== undefined)
      showtime.category = dto.category.trim() || 'Khác';
    if (dto.projectionType !== undefined)
      showtime.projectionType = dto.projectionType;
    if (dto.ageRating !== undefined) showtime.ageRating = dto.ageRating;
    if (dto.ticketSaleOpensAt !== undefined) {
      const v = dto.ticketSaleOpensAt?.trim() ?? '';
      showtime.ticketSaleOpensAt = v === '' ? null : new Date(v);
    }

    return this.showtimeRepo.save(showtime);
  }

  async deleteShowtime(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const affected = await this.showtimeRepo.deleteWithSeatsInTransaction(
        manager,
        id,
      );

      if (affected === 0) {
        throw new NotFoundException('Showtime not found');
      }
      return { success: true, message: 'Showtime and associated seats deleted' };
    });
  }

  async overrideSeatStatus(
    showtimeId: string,
    seatId: string,
    newStatus: string,
  ) {
    await this.showtimeRepo.updateSeatStatus(
      showtimeId,
      seatId,
      newStatus as SeatStatus,
    );

    if (newStatus === SeatStatus.AVAILABLE) {
      await this.redisService.del(`lock:${showtimeId}:${seatId}`);
    }

    return { success: true, seatId, newStatus };
  }
}
