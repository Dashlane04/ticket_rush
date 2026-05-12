import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload) throw new UnauthorizedException();
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    return {
      id: payload.sub,
      email: payload.email,
      tenant_id: payload.tenant_id,
      roles,
    };
  }
}
