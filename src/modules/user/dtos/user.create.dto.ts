import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

export class UserCreateDto {

  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  name: string;

  @ApiProperty({ example: "user@lnv.vn" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Str0ng@pass" })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: "0912345678" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "uuid-tenant" })
  @IsUUID("4")
  tenant: string;

  @ApiPropertyOptional({ example: ["uuid-role-1", "uuid-role-2"] })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  roles?: string[];
}