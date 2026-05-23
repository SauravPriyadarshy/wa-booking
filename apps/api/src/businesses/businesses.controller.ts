import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './businesses.dto';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';

@Controller('businesses')
export class BusinessesController {
  constructor(private businesses: BusinessesService) {}

  // Used by onboarding: creates business and attaches current user as BUSINESS_ADMIN
  @Post()
  @UseGuards(JwtUserGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateBusinessDto) {
    return this.businesses.createForUser(user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  me(@AuthUserDecorator() user: AuthUser) {
    return this.businesses.getBusinessForUser(user.userId);
  }

  @Post('me/regenerate-booking-slug')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  regenerateBookingSlug(@AuthUserDecorator() user: AuthUser) {
    return this.businesses.regenerateBookingSlug(user.userId);
  }
}

