import { Controller, Post, Get, Body, Request, Param } from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { BookTicketDto } from './dto/book-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('reserve')
  async reserveTickets(@Body() body: { showtimeId: string; seatIds: string[] }) {
    // Note: If you have real Auth, use req.user.id. 
    // If testing via the frontend we just built, you might need to pass userId in the body!
    const userId = body['userId'] || 'TEMP-USER'; 

    return this.ticketsService.reserveTickets(body.showtimeId, body.seatIds, userId);
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



  // --- VIRTUAL QUEUE ENDPOINTS ---

  @Post(':showtimeId/queue/join')
  async joinQueue(
    @Param('showtimeId') showtimeId: string,
    @Body('userId') userId: string // Usually extracted from JWT
  ) {
    return this.ticketsService.joinQueue(showtimeId, userId);
  }

  @Get(':showtimeId/queue/status/:userId')
  async getQueueStatus(
    @Param('showtimeId') showtimeId: string,
    @Param('userId') userId: string
  ) {
    return this.ticketsService.getQueueStatus(showtimeId, userId);
  }

  @Post(':showtimeId/queue/leave')
  async leaveQueue(
    @Param('showtimeId') showtimeId: string,
    @Body('userId') userId: string
  ) {
    return this.ticketsService.leaveQueue(showtimeId, userId);
  }

  @Post('reserve/cancel')
  async releaseLocks(@Body() body: { showtimeId: string; seatIds: string[] }) {
    return this.ticketsService.releaseLocks(body.showtimeId, body.seatIds);
  }

  
}
