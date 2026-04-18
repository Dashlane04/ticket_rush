import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto {

  @ApiProperty({ example: "artist@lnv.vn" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Str0ng@pass" })
  @IsString()
  password: string;
}