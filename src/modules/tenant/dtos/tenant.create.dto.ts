import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TenantCreateDto {
  @ApiProperty({ example: 'Live Nation Vietnam' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'LNV' })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    example: 'Đơn vị tổ chức sự kiện âm nhạc hàng đầu Việt Nam',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}
