import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRepository } from "../user/user.repository";
import { LoginDto } from "./dtos/login.dtos";
import { RegisterDto } from "./dtos/signup.dtos";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(body: LoginDto) {
    const { email, password } = body;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    if (!user.is_active) {
      throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(body: RegisterDto) {
    const existing = await this.userRepository.findByEmail(body.email);

    if (existing) {
      throw new ConflictException("Email đã được sử dụng");
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await this.userRepository.save(
      this.userRepository.create({
        ...body,
        password: hashed,
      })
    );

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}