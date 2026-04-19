import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { BookTicketDto } from './dto/book-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard) // ensure the user is logged in
  @Post('reserve')
  async reserve(@Request() req, @Body() dto: BookTicketDto) {
    // Flow trigger-point
    const userId = req.user.id;
    return await this.ticketsService.reserveRequest(dto, userId);
  }
}