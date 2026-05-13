import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { UserCreateDto } from './user.create.dto';

export class UserUpdateDto extends PartialType(
  OmitType(UserCreateDto, ['password'] as const),
) {
  @ApiPropertyOptional({ example: 'NewStr0ng@pass' })
  @IsOptional()
  @IsString()
  password?: string;
}
