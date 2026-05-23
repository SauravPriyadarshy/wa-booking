import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { AddTicketNoteDto, AssignTicketDto, CreateTicketDto, UpdateTicketStatusDto } from './support.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private support: SupportService) {}

  @Get('tickets')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser, @Query('status') status?: TicketStatus) {
    return this.support.list(user.businessId!, status);
  }

  @Post('tickets')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.support.create(user.businessId!, dto);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  setStatus(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.support.setStatus(user.businessId!, id, dto.status as TicketStatus);
  }

  @Patch('tickets/:id/note')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  addNote(@AuthUserDecorator() user: AuthUser, @Param('id') id: string, @Body() dto: AddTicketNoteDto) {
    return this.support.addNote(user.businessId!, id, dto.internalNotes);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  assign(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.support.assign(user.businessId!, id, dto.assignedToStaffId ?? null);
  }
}

