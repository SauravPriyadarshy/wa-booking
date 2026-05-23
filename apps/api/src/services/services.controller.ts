import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CreateServiceDto, UpdateServiceDto } from './services.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private services: ServicesService) {}

  @Get()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser) {
    return this.services.list(user.businessId!);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.services.create(user.businessId!, dto);
  }

  @Patch(':id')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  update(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(user.businessId!, id, dto);
  }
}

