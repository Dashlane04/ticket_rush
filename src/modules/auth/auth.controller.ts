import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dtos';
import { RegisterDto } from './dtos/signup.dtos';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

type AuthedRequest = {
  user: {
    id: string;
    email: string;
    tenant_id: string | null;
    roles: string[];
  };
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Thông tin user hiện tại (JWT)' })
  me(@Req() req: AuthedRequest) {
    return {
      id: req.user.id,
      email: req.user.email,
      tenant_id: req.user.tenant_id,
      roles: req.user.roles ?? [],
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Lấy access_token mới từ refresh_token' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Thu hồi refresh token (đăng xuất phiên)' })
  @ApiBody({ type: RefreshTokenDto })
  async logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body);
  }
}
