import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { UserRole } from '../common/auth/user-role.enum';
import { SuperCreateBusinessDto } from './superadmin.dto';
import { SuperAdminService } from './superadmin.service';
import { SetBusinessFeatureDto } from './features.dto';

@Controller('superadmin')
@UseGuards(JwtUserGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private superadmin: SuperAdminService) {}

  @Get('businesses')
  list() {
    return this.superadmin.listBusinesses();
  }

  @Post('businesses')
  create(@Body() dto: SuperCreateBusinessDto) {
    return this.superadmin.createBusinessWithAdmin(dto);
  }

  @Get('features')
  features(@Query('businessId') businessId: string) {
    return this.superadmin.listBusinessFeatures(businessId);
  }

  @Post('features')
  setFeature(@Body() dto: SetBusinessFeatureDto) {
    return this.superadmin.setBusinessFeature(dto);
  }
}

