import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ADMIN_ROLE_NAME } from '../auth/admin-role.constant';
import { TicketsService } from './tickets.service';

type AuthedRequest = Request & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  private assertTicketsForUserAllowed(req: AuthedRequest['user'], userId: string) {
    const isSelf = req.id === userId;
    const isAdmin = req.roles?.includes(ADMIN_ROLE_NAME) ?? false;
    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Không được xem vé của người dùng khác.');
    }
  }

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
  @UseGuards(JwtAuthGuard)
  async getTicketsForUser(@Req() req: AuthedRequest, @Param('userId') userId: string) {
    this.assertTicketsForUserAllowed(req.user, userId);
    return await this.ticketsService.getTicketsForUser(userId);
  }

  @Get('user/:userId/ticket/:ticketId')
  @UseGuards(JwtAuthGuard)
  async getTicketForUser(
    @Req() req: AuthedRequest,
    @Param('userId') userId: string,
    @Param('ticketId') ticketId: string,
  ) {
    this.assertTicketsForUserAllowed(req.user, userId);
    return await this.ticketsService.getTicketForUser(userId, ticketId);
  }

  @Get(':id/seats')
  async getSeatMap(@Param('id') showtimeId: string) {
    return await this.ticketsService.getSeatMap(showtimeId);
  }

  @Post('release')
  @UseGuards(JwtAuthGuard)
  async releaseSeat(
    @Req() req: AuthedRequest,
    @Body() body: { showtimeId: string; seatId: string },
  ) {
    return this.ticketsService.releaseSeatLock(
      body.showtimeId,
      body.seatId,
    );
  }

  @Post('validate-promo')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async joinQueue(
    @Req() req: AuthedRequest,
    @Param('showtimeId') showtimeId: string,
  ) {
    return this.ticketsService.joinQueue(showtimeId, req.user.id);
  }

  @Get(':showtimeId/queue/status')
  @UseGuards(JwtAuthGuard)
  async getQueueStatus(
    @Req() req: AuthedRequest,
    @Param('showtimeId') showtimeId: string,
  ) {
    return this.ticketsService.getQueueStatus(showtimeId, req.user.id);
  }

  @Post(':showtimeId/queue/leave')
  @UseGuards(JwtAuthGuard)
  async leaveQueue(
    @Req() req: AuthedRequest,
    @Param('showtimeId') showtimeId: string,
  ) {
    return this.ticketsService.leaveQueue(showtimeId, req.user.id);
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
