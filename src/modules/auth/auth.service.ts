import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { RedisService } from 'src/redis/redis.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserRepository } from '../user/user.repository';
import { LoginDto } from './dtos/login.dtos';
import { RegisterDto } from './dtos/signup.dtos';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import * as bcrypt from 'bcrypt';

const REFRESH_KEY_PREFIX = 'auth:refresh:';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private refreshTtlSec(): number {
    const raw = this.config.get<string>('JWT_REFRESH_TTL_SEC');
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 604800;
  }

  private async buildAccessPayload(user: UserEntity) {
    const roles = await this.userRepository.findRoleNamesByUserId(user.id);
    return {
      sub: user.id,
      email: user.email,
      roles,
    };
  }

  private async issueTokenPair(user: UserEntity) {
    const payload = await this.buildAccessPayload(user);
    const access_token = this.jwtService.sign(payload);
    const refresh_token = randomBytes(32).toString('hex');
    await this.redis.set(
      `${REFRESH_KEY_PREFIX}${refresh_token}`,
      { sub: user.id },
      this.refreshTtlSec(),
    );
    return { access_token, refresh_token };
  }

  async login(body: LoginDto) {
    const { email, password } = body;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.issueTokenPair(user);
  }

  async register(body: RegisterDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const existingEmail = await this.userRepository.findByEmail(body.email);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    if (body.phone?.trim()) {
      const existingPhone = await this.userRepository.findByPhone(
        body.phone.trim(),
      );
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await this.userRepository.save(
      this.userRepository.create({
        name: body.name.trim(),
        email: body.email.trim(),
        password: hashed,
        ...(body.phone?.trim() ? { phone: body.phone.trim() } : {}),
      }),
    );

    return this.issueTokenPair(user);
  }

  async refresh(body: RefreshTokenDto) {
    const key = `${REFRESH_KEY_PREFIX}${body.refresh_token}`;
    const stored = (await this.redis.get(key)) as { sub?: string } | null;
    if (!stored?.sub) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: stored.sub },
    });
    if (!user || user.is_deleted || !user.is_active) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const payload = await this.buildAccessPayload(user);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(body: RefreshTokenDto) {
    await this.redis.del(`${REFRESH_KEY_PREFIX}${body.refresh_token}`);
    return { ok: true };
  }
}
