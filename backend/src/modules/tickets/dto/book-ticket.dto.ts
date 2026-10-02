import { IsNotEmpty, IsString } from 'class-validator';

export class BookTicketDto {
  @IsString()
  @IsNotEmpty()
  seatId!: string;

  @IsString()
  @IsNotEmpty()
  showtimeId!: string;
}
