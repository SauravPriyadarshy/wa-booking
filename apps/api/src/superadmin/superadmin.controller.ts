import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { UserRole } from '../common/auth/user-role.enum';
import { SuperCreateBusinessDto, CreateActivationCodeDto, SetBusinessPlanDto } from './superadmin.dto';
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

  @Get('stats')
  stats() {
    return this.superadmin.stats();
  }

  @Get('activation-codes')
  activationCodes() {
    return this.superadmin.listActivationCodes();
  }

  @Post('activation-codes')
  createActivationCode(@Body() dto: CreateActivationCodeDto) {
    return this.superadmin.createActivationCode(dto);
  }

  @Patch('activation-codes/:id')
  toggleActivationCode(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.superadmin.setActivationCodeActive(id, body.isActive);
  }

  @Post('business-plan')
  setBusinessPlan(@Body() dto: SetBusinessPlanDto) {
    return this.superadmin.setBusinessPlan(dto.businessId, dto.plan, dto.validityDays);
  }
}

