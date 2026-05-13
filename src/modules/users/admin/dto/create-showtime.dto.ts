import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateShowtimeDto {
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  durationMinutes?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  rows: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  cols: number;

  @IsString()
  @IsOptional()
  theatreName?: string;

  @IsString()
  @IsOptional()
  hallName?: string;

  @IsString()
  @IsOptional()
  projectionType?: string;

  @IsString()
  @IsOptional()
  ageRating?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : value))
  @IsDateString()
  ticketSaleOpensAt?: string;
}
