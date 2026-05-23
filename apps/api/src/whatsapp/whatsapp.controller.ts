import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsapp: WhatsAppService) {}

  @Get('status')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  async status(@AuthUserDecorator() user: AuthUser) {
    const [base, live] = await Promise.all([
      this.whatsapp.getStatus(user.businessId!),
      this.whatsapp.workerStatus(user.businessId!).catch(() => null),
    ]);
    return { ...base, ...(live ?? {}) };
  }

  @Post('connect')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  connect(@AuthUserDecorator() user: AuthUser) {
    return this.whatsapp.connect(user.businessId!);
  }
}

