// src/modules/tickets/dto/book-ticket.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';

export class BookTicketDto {
  @IsString()
  @IsNotEmpty()
  seatId!: string;

  @IsString()
  @IsNotEmpty()
  showtimeId!: string;
}