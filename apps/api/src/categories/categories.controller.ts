import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/auth/roles.decorator';
import { UserRole } from '../common/auth/user-role.enum';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.listActive();
  }

  // convenience seed for local dev; SUPER_ADMIN only
  @Post('seed-defaults')
  @UseGuards(JwtUserGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  seed() {
    return this.categories.seedDefaults();
  }
}

