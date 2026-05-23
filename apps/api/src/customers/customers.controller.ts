import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RequireBusinessGuard } from '../common/tenant/require-business.guard';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  list(@AuthUserDecorator() user: AuthUser) {
    return this.customers.list(user.businessId!);
  }

  @Post()
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  create(@AuthUserDecorator() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.customers.create(user.businessId!, dto);
  }

  @Patch(':id')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  update(
    @AuthUserDecorator() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(user.businessId!, id, dto);
  }

  @Get(':id')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  get(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.customers.get(user.businessId!, id);
  }

  @Get(':id/timeline')
  @UseGuards(JwtUserGuard, RequireBusinessGuard)
  timeline(@AuthUserDecorator() user: AuthUser, @Param('id') id: string) {
    return this.customers.timeline(user.businessId!, id);
  }
}

