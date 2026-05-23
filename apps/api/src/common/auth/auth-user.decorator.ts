import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth.types';

export const AuthUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser | undefined;
  },
);

