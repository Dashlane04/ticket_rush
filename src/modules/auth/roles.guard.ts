import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    /** Chi bo qua khi SKIP_ADMIN_ROLE=true (tuy chon local). Khong bypass theo NODE_ENV. */
    if (process.env.SKIP_ADMIN_ROLE === 'true') {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const roles: string[] = req.user?.roles ?? [];
    const ok = required.some((r) => roles.includes(r));
    if (!ok) {
      throw new ForbiddenException('Không có quyền thực hiện thao tác này');
    }
    return true;
  }
}
