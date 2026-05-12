import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'hello@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ng@pass' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Str0ng@pass' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;
}
