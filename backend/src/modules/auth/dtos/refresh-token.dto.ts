import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token từ login/register' })
  @IsString()
  @MinLength(1)
  refresh_token: string;
}
