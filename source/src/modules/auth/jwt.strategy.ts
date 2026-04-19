import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Parse (Authorization Header as a Bearer token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Check if token expired
      ignoreExpiration: false,
      
      // 3. Verify using secret key
      secretOrKey: 'YOUR_VERY_SECRET_KEY', // use process.env.JWT_SECRET
    });
  }

  /**
   * 4. Utilize decoded data
   * -> After verification, Passport calls this method with the decoded JSON payload.
   */
  async validate(payload: any) {
    // Whatever returns become 'req.user' in controller.
    return { id: payload.sub, email: payload.email };
  }
}