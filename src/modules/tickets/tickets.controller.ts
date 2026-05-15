import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { BookTicketDto } from './dto/book-ticket.dto';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & {
  user: {
    id: string;
    email: string;
    tenant_id: string | null;
    roles: string[];
  };
};

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  async reserveTickets(
    @Req() req: AuthedRequest,
    @Body() body: { showtimeId: string; seatIds: string[] },
  ) {
    return this.ticketsService.reserveTickets(
      body.showtimeId,
      body.seatIds,
      req.user.id,
    );
  }

  @Get('showtimes')
  async getShowtimes() {
    return await this.ticketsService.getShowtimeList();
  }

  @Get('showtimes/:id')
  async getShowtime(@Param('id') showtimeId: string) {
    return await this.ticketsService.getShowtimeById(showtimeId);
  }

  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  async getMyTickets(@Req() req: AuthedRequest) {
    return await this.ticketsService.getTicketsForUser(req.user.id);
  }

  @Get('my-history/:ticketId')
  @UseGuards(JwtAuthGuard)
  async getMyTicket(
    @Req() req: AuthedRequest,
    @Param('ticketId') ticketId: string,
  ) {
    return await this.ticketsService.getTicketForUser(req.user.id, ticketId);
  }

  @Get('user/:userId')
  async getTicketsForUser(@Param('userId') userId: string) {
    return await this.ticketsService.getTicketsForUser(userId);
  }

  @Get('user/:userId/ticket/:ticketId')
  async getTicketForUser(
    @Param('userId') userId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return await this.ticketsService.getTicketForUser(userId, ticketId);
  }

  @Get(':id/seats')
  async getSeatMap(@Param('id') showtimeId: string) {
    return await this.ticketsService.getSeatMap(showtimeId);
  }

  @Post('release')
  async releaseSeat(
    @Body() body: { showtimeId: string; seatId: string },
  ) {
    return this.ticketsService.releaseSeatLock(body.showtimeId, body.seatId);
  }

  @Post('validate-promo')
  async validatePromo(@Body() body: { code: string }) {
    return this.ticketsService.validatePromoCode(body.code);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseTickets(
    @Req() req: AuthedRequest,
    @Body() body: { showtimeId: string; seatIds: string[]; promoCode?: string },
  ) {
    return this.ticketsService.purchaseTickets(
      req.user.id,
      body.showtimeId,
      body.seatIds,
      body.promoCode,
    );
  }

  @Post(':showtimeId/queue/join')
  async joinQueue(
    @Param('showtimeId') showtimeId: string,
    @Body('userId') userId: string,
  ) {
    return this.ticketsService.joinQueue(showtimeId, userId);
  }

  @Get(':showtimeId/queue/status/:userId')
  async getQueueStatus(
    @Param('showtimeId') showtimeId: string,
    @Param('userId') userId: string,
  ) {
    return this.ticketsService.getQueueStatus(showtimeId, userId);
  }

  @Post(':showtimeId/queue/leave')
  async leaveQueue(
    @Param('showtimeId') showtimeId: string,
    @Body('userId') userId: string,
  ) {
    return this.ticketsService.leaveQueue(showtimeId, userId);
  }

  @Post('reserve/cancel')
  @UseGuards(JwtAuthGuard)
  async releaseLocks(
    @Req() req: AuthedRequest,
    @Body() body: { showtimeId: string; seatIds: string[] },
  ) {
    return this.ticketsService.releaseLocks(
      body.showtimeId,
      body.seatIds,
      req.user.id,
    );
  }

  @Post('ping')
  async ping(@Body() body: { sessionId: string }) {
    if (!body.sessionId) return { success: false };
    return this.ticketsService.recordPing(body.sessionId);
  }
}
