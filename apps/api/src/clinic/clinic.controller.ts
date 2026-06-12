import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { ClinicService } from './clinic.service';
import {
  NextPatientDto,
  UpdateClinicPaymentDto,
  UpdateQueueStatusDto,
  WalkInRegisterDto,
} from './clinic.dto';

@Controller('clinic')
@UseGuards(JwtUserGuard, RequireBusinessGuard)
export class ClinicController {
  constructor(private clinic: ClinicService) {}

  @Get('queue')
  getQueue(@AuthUserDecorator() user: AuthUser, @Query('staffId') staffId?: string) {
    return this.clinic.getLiveQueue(user.businessId!, staffId);
  }

  @Post('walk-in/register')
  registerWalkIn(@AuthUserDecorator() user: AuthUser, @Body() dto: WalkInRegisterDto) {
    return this.clinic.registerWalkIn(user.businessId!, dto);
  }

  @Patch('queue/next-patient')
  nextPatient(@AuthUserDecorator() user: AuthUser, @Body() dto: NextPatientDto) {
    return this.clinic.advanceNextPatient(user.businessId!, dto);
  }

  @Patch('queue/:id/status')
  updateStatus(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateQueueStatusDto,
  ) {
    return this.clinic.updateQueueStatus(user.businessId!, id, dto);
  }

  @Patch('queue/:id/payment')
  updatePayment(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateClinicPaymentDto,
  ) {
    return this.clinic.updatePaymentStatus(user.businessId!, id, dto);
  }
}
