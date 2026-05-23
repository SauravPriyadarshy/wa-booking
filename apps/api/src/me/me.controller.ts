import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private me: MeService) {}

  @Get()
  @UseGuards(JwtUserGuard)
  get(@AuthUserDecorator() user: AuthUser) {
    return this.me.getMe(user.userId);
  }

  @Get('ui')
  @UseGuards(JwtUserGuard)
  ui(@AuthUserDecorator() user: AuthUser) {
    return this.me.getUiConfig(user.userId);
  }
}

