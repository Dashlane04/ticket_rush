import { IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';

/** Payload từ frontend admin khi sửa showtime (không đổi lưới ghế). */
export class UpdateShowtimeDto {
  @IsOptional()
  @IsString()
  movieTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  ticketSaleOpensAt?: string;

  @IsOptional()
  @IsString()
  projectionType?: string;

  @IsOptional()
  @IsString()
  ageRating?: string;

  @IsOptional()
  @IsNumber()
  maxSeatsPerBooking?: number;
}
