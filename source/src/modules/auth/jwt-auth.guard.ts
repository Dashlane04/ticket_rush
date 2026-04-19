import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * This method handles the result of the token validation.
   * If there's an error or no user was found, it throws an 401 Unauthorized.
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Please log in to book tickets');
    }
    return user;
  }
}