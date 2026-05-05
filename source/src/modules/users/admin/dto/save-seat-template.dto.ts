import { IsObject, IsArray, IsString, IsOptional } from 'class-validator';

export class SaveSeatTemplateDto {
  @IsString()
  @IsOptional()
  templateName?: string; // <-- Added

  @IsString()
  @IsOptional()
  hallName?: string; // <-- Added

  @IsObject()
  dimensions: { rows: number; columns: number; };

  @IsObject()
  seatConfiguration: any;

  @IsArray()
  layout: Array<{
    id: string;      // The actual seat text (e.g. "A12")
    gridCol: number;
    gridRow: number;
    type: string;
    isBlocked: boolean;
  }>;
}