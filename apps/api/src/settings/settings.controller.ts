import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { UserRole } from '../common/auth/user-role.enum';
import { AddHolidayDto, SetBusinessHoursDto } from './settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get('hours')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  hours(@AuthUserDecorator() user: AuthUser) {
    return this.settings.listHours(user.businessId!);
  }

  @Post('hours')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  setHours(@AuthUserDecorator() user: AuthUser, @Body() dto: SetBusinessHoursDto) {
    return this.settings.setHours(user.businessId!, dto);
  }

  @Get('holidays')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  holidays(@AuthUserDecorator() user: AuthUser) {
    return this.settings.listHolidays(user.businessId!);
  }

  @Post('holidays')
  @UseGuards(JwtUserGuard, RequireBusinessGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  addHoliday(@AuthUserDecorator() user: AuthUser, @Body() dto: AddHolidayDto) {
    return this.settings.addHoliday(user.businessId!, dto);
  }
}

