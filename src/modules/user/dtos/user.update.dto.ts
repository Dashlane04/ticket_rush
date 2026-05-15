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

  @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '2000-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  date_of_birth?: string;
}
