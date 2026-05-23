import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { CreateLeadDto, UpdateLeadStageDto } from './leads.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private leads: LeadsService) {}

  @Get()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser, @Query('stage') stage?: LeadStage) {
    return this.leads.list(user.businessId!, stage);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateLeadDto) {
    return this.leads.create(user.businessId!, dto);
  }

  @Patch(':id/stage')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  setStage(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStageDto,
  ) {
    return this.leads.setStage(user.businessId!, id, dto.stage, dto.notes);
  }
}

