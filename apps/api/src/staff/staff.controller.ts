import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CreateStaffDto, SetStaffHoursDto, ToggleAvailabilityDto } from './staff.dto';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private staff: StaffService) {}

  @Get()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser) {
    return this.staff.list(user.businessId!);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateStaffDto) {
    return this.staff.create(user.businessId!, dto);
  }

  @Patch(':id/availability')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  availability(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.staff.setAvailability(user.businessId!, id, dto.isAvailable);
  }

  @Post(':id/hours')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  setHours(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetStaffHoursDto,
  ) {
    return this.staff.setHours(user.businessId!, id, dto);
  }
}

