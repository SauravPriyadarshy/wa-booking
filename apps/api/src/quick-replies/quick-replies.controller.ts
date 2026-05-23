import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CreateQuickReplyDto } from './quick-replies.dto';
import { QuickRepliesService } from './quick-replies.service';

@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private quickReplies: QuickRepliesService) {}

  @Get()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser) {
    return this.quickReplies.list(user.businessId!);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateQuickReplyDto) {
    return this.quickReplies.create(user.businessId!, dto);
  }
}

