import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsDateString, 
  Min 
} from 'class-validator';

export class CreateShowtimeDto {
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  // Expects an ISO 8601 date string (e.g., "2026-05-04T15:30:00Z")
  @IsDateString() 
  @IsNotEmpty()
  startTime: string;

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
  projectionType?: string; // e.g., "2D", "3D", "IMAX"

  @IsString()
  @IsOptional()
  ageRating?: string; // e.g., "T16"
}