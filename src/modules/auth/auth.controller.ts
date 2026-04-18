import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dtos/login.dtos";
import { RegisterDto } from "./dtos/signup.dtos";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {

  constructor(
    private readonly authService: AuthService
  ) {}

  @Post("login")
  @ApiOperation({ summary: "Đăng nhập" })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("register")
  @ApiOperation({ summary: "Đăng ký" })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
}