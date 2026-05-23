import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '../auth/user-role.enum';

@Injectable()
export class RequireBusinessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) return false;

    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (!user.businessId)
      throw new BadRequestException('Business not set for this user');
    return true;
  }
}

