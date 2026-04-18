import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

export class RegisterDto {

  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  name: string;

  @ApiProperty({ example: "artist@lnv.vn" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Str0ng@pass" })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: "0912345678" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "uuid-tenant" })
  @IsUUID("4")
  @IsOptional()
  tenant?: string;
}