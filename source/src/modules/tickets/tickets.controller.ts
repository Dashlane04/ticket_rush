import { Controller, Post, Get, Body, Request, Param } from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { BookTicketDto } from './dto/book-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('reserve')
  async reserve(@Request() req, @Body() dto: BookTicketDto) {
    const userId = req.user?.id ?? 'guest-user';
    return await this.ticketsService.reserveRequest(dto, userId);
  }

  @Get('showtimes')
  async getShowtimes() {
    return await this.ticketsService.getShowtimeList();
  }

  @Get('showtimes/:id')
  async getShowtime(@Param('id') showtimeId: string) {
    return await this.ticketsService.getShowtimeById(showtimeId);
  }

  @Get(':id/seats')
  async getSeatMap(@Param('id') showtimeId: string) {
    return await this.ticketsService.getSeatMap(showtimeId);
  }

  @Post('release')
  async releaseSeat(@Body() body: { showtimeId: string; seatId: string }) {
    return this.ticketsService.releaseSeatLock(body.showtimeId, body.seatId);
  }

  // --- NEW: Finalize Purchase Endpoint ---
  @Post('purchase')
  async purchaseTickets(@Body() body: { showtimeId: string; seatIds: string[] }) {
    return this.ticketsService.purchaseTickets("TEST-USER-ID", body.showtimeId, body.seatIds);
  }
}
