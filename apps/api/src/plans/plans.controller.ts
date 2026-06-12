import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) {}

  @Get('me')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  me(@AuthUserDecorator() user: AuthUser) {
    return this.plans.usage(user.businessId!);
  }
}
