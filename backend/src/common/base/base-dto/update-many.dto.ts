import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateManyDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('all', { each: true })
  ids: string[];
}
