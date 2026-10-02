import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class SaveSeatTemplateDto {
  @IsString()
  @IsOptional()
  templateName?: string;

  @IsString()
  @IsOptional()
  hallName?: string;

  @IsObject()
  dimensions: { rows: number; columns: number };

  @IsObject()
  seatConfiguration: unknown;

  @IsArray()
  layout: Array<{
    id: string;
    gridCol: number;
    gridRow: number;
    type: string;
    isBlocked: boolean;
  }>;
}
