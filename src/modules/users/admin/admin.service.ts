import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ShowtimeSeat, SeatStatus } from 'src/modules/tickets/entities/showtime-seat.entity';
import type { SeatType } from 'src/modules/tickets/entities/showtime-seat.entity';
import { SeatTemplate } from 'src/modules/tickets/entities/template-seat.entity';
import { PromoCode } from 'src/modules/tickets/entities/promo-code.entity';
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
    @InjectRepository(PromoCode)
    private readonly promoCodeRepo: Repository<PromoCode>,
    private readonly redisService: RedisService,
  ) {}

  async createPromoCode(data: { code: string; discountPercent: number; maxUses?: number; validUntil?: string }) {
    const code = data.code.toUpperCase();
    const existing = await this.promoCodeRepo.findOne({ where: { code } });
    if (existing) throw new Error('Promo code already exists');
    
    const promo = this.promoCodeRepo.create({
      code,
      discountPercent: data.discountPercent,
      maxUses: data.maxUses,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
    });
    return this.promoCodeRepo.save(promo);
  }

  async listPromoCodes() {
    return this.promoCodeRepo.find({ order: { createdAt: 'DESC' } });
  }

  async deletePromoCode(id: string) {
    const promo = await this.promoCodeRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    return this.promoCodeRepo.remove(promo);
  }

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
        maxSeatsPerBooking: dto.maxSeatsPerBooking ?? 8,
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
        price: (dto.seatConfiguration as Record<string, { price?: number }>)?.[seat.type]?.price ?? 15.0,
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
        price: (dto.seatConfiguration as Record<string, { price?: number }>)?.[seat.type]?.price ?? 15.0,
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
      price: ts.price,
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
    if (dto.maxSeatsPerBooking !== undefined) {
      showtime.maxSeatsPerBooking = dto.maxSeatsPerBooking;
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

  async getLiveUsersCount() {
    const minScore = Date.now() - 30000;
    const maxScore = Date.now();
    // Prune old users first
    await this.redisService.zRemRangeByScore('active_users', 0, minScore - 1).catch(() => {});
    const active = await this.redisService.zRangeByScore('active_users', minScore, maxScore);
    return { count: active.length };
  }

  async getUserStats() {
    // 1. Gender distribution
    const genderRows = await this.dataSource.query(`
      SELECT gender, COUNT(id) as count
      FROM "user"
      WHERE is_deleted = false
      GROUP BY gender
    `);
    const gender = genderRows.map((row: any) => ({
      name: row.gender || 'UNKNOWN',
      count: parseInt(row.count, 10),
    }));

    // 2. Age demographics
    const ageRows = await this.dataSource.query(`
      SELECT 
        CASE 
          WHEN age < 18 THEN '<18'
          WHEN age >= 18 AND age <= 24 THEN '18-24'
          WHEN age >= 25 AND age <= 34 THEN '25-34'
          WHEN age >= 35 AND age <= 44 THEN '35-44'
          WHEN age >= 45 THEN '45+'
          ELSE 'Unknown'
        END as age_group,
        COUNT(*) as count
      FROM (
        SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth)) as age
        FROM "user"
        WHERE date_of_birth IS NOT NULL AND is_deleted = false
      ) as ages
      GROUP BY age_group
    `);
    
    // Fill missing buckets with 0
    const ageBuckets = { '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'Unknown': 0 };
    for (const row of ageRows) {
      ageBuckets[row.age_group as keyof typeof ageBuckets] = parseInt(row.count, 10);
    }
    const age = Object.entries(ageBuckets).map(([name, count]) => ({ name, count }));

    // 3. Favorite Genres
    const genreRows = await this.dataSource.query(`
      SELECT s.category, COUNT(t.id) as count
      FROM tickets t
      INNER JOIN showtimes s ON t."showtimeId"::uuid = s.id
      WHERE t.status = 'CONFIRMED'
      GROUP BY s.category
      ORDER BY count DESC
      LIMIT 5
    `);
    const genres = genreRows.map((row: any) => ({
      name: row.category || 'Khác',
      count: parseInt(row.count, 10),
    }));

    return { gender, age, genres };
  }

  async getPurchaseStats() {
    // 1. Revenue & Volume over time (last 30 days, grouped by date)
    const dailyRows = await this.dataSource.query(`
      SELECT
        DATE("createdAt") as date,
        COUNT(id) as ticket_count,
        COALESCE(SUM(price), 0) as revenue
      FROM tickets
      WHERE status = 'CONFIRMED'
        AND "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `);
    const dailyRevenue = dailyRows.map((r: any) => ({
      date: r.date,
      tickets: parseInt(r.ticket_count, 10),
      revenue: parseFloat(r.revenue),
    }));

    // 2. Monthly trend (last 6 months)
    const monthlyRows = await this.dataSource.query(`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(id) as ticket_count,
        COALESCE(SUM(price), 0) as revenue
      FROM tickets
      WHERE status = 'CONFIRMED'
        AND "createdAt" >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `);
    const monthlyRevenue = monthlyRows.map((r: any) => ({
      month: r.month,
      tickets: parseInt(r.ticket_count, 10),
      revenue: parseFloat(r.revenue),
    }));

    // 3. Revenue by category (pie chart)
    const catRows = await this.dataSource.query(`
      SELECT s.category, COALESCE(SUM(t.price), 0) as revenue, COUNT(t.id) as count
      FROM tickets t
      INNER JOIN showtimes s ON t."showtimeId"::uuid = s.id
      WHERE t.status = 'CONFIRMED'
      GROUP BY s.category
      ORDER BY revenue DESC
    `);
    const revenueByCategory = catRows.map((r: any) => ({
      name: r.category || 'Khác',
      revenue: parseFloat(r.revenue),
      count: parseInt(r.count, 10),
    }));

    // 4. Top 5 events by revenue
    const topRows = await this.dataSource.query(`
      SELECT s."movieTitle" as title, s.category,
        COUNT(t.id) as tickets_sold,
        COALESCE(SUM(t.price), 0) as revenue
      FROM tickets t
      INNER JOIN showtimes s ON t."showtimeId"::uuid = s.id
      WHERE t.status = 'CONFIRMED'
      GROUP BY s.id, s."movieTitle", s.category
      ORDER BY revenue DESC
      LIMIT 5
    `);
    const topEvents = topRows.map((r: any) => ({
      title: r.title,
      category: r.category || 'Khác',
      ticketsSold: parseInt(r.tickets_sold, 10),
      revenue: parseFloat(r.revenue),
    }));

    // 5. Overall KPIs
    const kpiRows = await this.dataSource.query(`
      SELECT
        COUNT(id) as total_tickets,
        COALESCE(SUM(price), 0) as total_revenue,
        COALESCE(AVG(price), 0) as avg_price,
        COUNT(DISTINCT "userId") as unique_buyers
      FROM tickets
      WHERE status = 'CONFIRMED'
    `);
    const kpi = kpiRows[0] || {};
    const overview = {
      totalTickets: parseInt(kpi.total_tickets ?? '0', 10),
      totalRevenue: parseFloat(kpi.total_revenue ?? '0'),
      avgTicketPrice: parseFloat(kpi.avg_price ?? '0'),
      uniqueBuyers: parseInt(kpi.unique_buyers ?? '0', 10),
    };

    return { dailyRevenue, monthlyRevenue, revenueByCategory, topEvents, overview };
  }
}
