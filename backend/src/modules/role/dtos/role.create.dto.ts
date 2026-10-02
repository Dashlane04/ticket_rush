import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class RoleCreateDto {
  @ApiProperty({ example: 'Admin' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Quản lý toàn bộ hệ thống' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  permissions: string[];
}
