import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { HubCreateLeadDto, HubCreateTicketDto } from './hub.dto';
import { HubService } from './hub.service';

@Controller('hub')
export class HubController {
  constructor(private hub: HubService) {}

  @Get('dashboard')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  dashboard(@AuthUserDecorator() user: AuthUser) {
    return this.hub.dashboard(user.businessId!, user.userId);
  }

  @Get('inbox')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  inbox(@AuthUserDecorator() user: AuthUser) {
    return this.hub.inbox(user.businessId!);
  }

  @Get('quick-replies')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  quickReplies(@AuthUserDecorator() user: AuthUser) {
    return this.hub.quickReplies(user.businessId!);
  }

  @Get('today')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  today(@AuthUserDecorator() user: AuthUser) {
    return this.hub.today(user.businessId!);
  }

  @Post('leads')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  createLead(@AuthUserDecorator() user: AuthUser, @Body() dto: HubCreateLeadDto) {
    return this.hub.createLead(user.businessId!, dto);
  }

  @Post('tickets')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  createTicket(@AuthUserDecorator() user: AuthUser, @Body() dto: HubCreateTicketDto) {
    return this.hub.createTicket(user.businessId!, dto);
  }

  @Get('health')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  health(@AuthUserDecorator() user: AuthUser) {
    return this.hub.health(user.businessId!);
  }

  @Get('revenue-leakage')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  revenueLeakage(@AuthUserDecorator() user: AuthUser) {
    return this.hub.revenueLeakage(user.businessId!);
  }

  @Get('coaching-snapshot')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  coachingSnapshot(@AuthUserDecorator() user: AuthUser) {
    return this.hub.coachingSnapshot(user.businessId!);
  }

  @Get('queue')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  queue(@AuthUserDecorator() user: AuthUser) {
    return this.hub.queue(user.businessId!);
  }

  @Get('clinic-snapshot')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  clinicSnapshot(@AuthUserDecorator() user: AuthUser) {
    return this.hub.clinicSnapshot(user.businessId!);
  }

  @Get('reactivation')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  reactivation(@AuthUserDecorator() user: AuthUser) {
    return this.hub.reactivation(user.businessId!);
  }
}

