import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CreatePaymentDto, UpsertPaymentConfigDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Get('config')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  config(@AuthUserDecorator() user: AuthUser) {
    return this.payments.getConfig(user.businessId!);
  }

  @Post('config')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  upsertConfig(@AuthUserDecorator() user: AuthUser, @Body() dto: UpsertPaymentConfigDto) {
    return this.payments.upsertConfig(user.businessId!, dto);
  }

  @Get('pending')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  pending(@AuthUserDecorator() user: AuthUser) {
    return this.payments.pending(user.businessId!);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.payments.createPayment(user.businessId!, dto);
  }

  @Patch(':id/verify')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  verify(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.payments.verify(user.businessId!, id);
  }
}

