import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const customExtractor = (req: any) => {
  let token = null;
  
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  if (!token && req.headers?.cookie) {
    const cookies = req.headers.cookie.split(';').map((c) => c.trim());
    const accessCookie = cookies.find((c) => c.startsWith('access_token='));
    if (accessCookie) {
      token = accessCookie.substring('access_token='.length);
    }
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: customExtractor,
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
      roles,
    };
  }
}
