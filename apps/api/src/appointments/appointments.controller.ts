import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './appointments.dto';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
  constructor(private appointments: AppointmentsService) {}

  @Get('upcoming')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  upcoming(@AuthUserDecorator() user: AuthUser) {
    return this.appointments.listUpcoming(user.businessId!);
  }

  @Get('day')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  day(@AuthUserDecorator() user: AuthUser, @Query('date') date?: string) {
    const d =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().slice(0, 10);
    return this.appointments.listForDay(user.businessId!, d);
  }

  @Get('slots')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  slots(
    @AuthUserDecorator() user: AuthUser,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.appointments.slots(user.businessId!, serviceId, date, staffId);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user.businessId!, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  status(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(user.businessId!, id, dto.status as AppointmentStatus);
  }
}

