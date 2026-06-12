import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { AnalyticsService } from './analytics.service';
import { PlansService } from '../plans/plans.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private analytics: AnalyticsService,
    private plans: PlansService,
  ) {}

  @Get('summary')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  async summary(@AuthUserDecorator() user: AuthUser) {
    await this.plans.assertFeature(user.businessId!, 'advanced_analytics');
    return this.analytics.summary(user.businessId!);
  }

  /** GET /analytics/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD */
  @Get('range')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  async range(
    @AuthUserDecorator() user: AuthUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    await this.plans.assertFeature(user.businessId!, 'advanced_analytics');
    return this.analytics.dateRange(user.businessId!, startDate, endDate);
  }

  /** GET /analytics/top-services?days=30 */
  @Get('top-services')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  async topServices(
    @AuthUserDecorator() user: AuthUser,
    @Query('days') days?: string,
  ) {
    await this.plans.assertFeature(user.businessId!, 'advanced_analytics');
    return this.analytics.topServices(user.businessId!, days ? Number(days) : 30);
  }

  /** GET /analytics/revenue?days=30 */
  @Get('revenue')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  async revenue(
    @AuthUserDecorator() user: AuthUser,
    @Query('days') days?: string,
  ) {
    await this.plans.assertFeature(user.businessId!, 'advanced_analytics');
    return this.analytics.revenueByDay(user.businessId!, days ? Number(days) : 30);
  }
}
