import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetAllDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({ example: 'Sơn Tùng' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ example: '-1', enum: ['1', '-1'] })
  @IsIn(['1', '-1'])
  @IsOptional()
  sort?: '1' | '-1';

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  is_active?: boolean;
}
