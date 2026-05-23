import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private convos: ConversationsService) {}

  @Get()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser) {
    return this.convos.list(user.businessId!);
  }

  @Get(':id/messages')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  messages(@AuthUserDecorator() user: AuthUser, @Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.convos.messages(user.businessId!, id, cursor);
  }
}

