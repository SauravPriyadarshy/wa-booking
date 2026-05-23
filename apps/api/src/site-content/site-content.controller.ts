import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { UserRole } from '../common/auth/user-role.enum';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { SiteContentService } from './site-content.service';
import { BulkUpsertSiteContentDto, UpsertSiteContentDto } from './site-content.dto';

@Controller('site-content')
export class SiteContentController {
  constructor(private siteContent: SiteContentService) {}

  /** Public: get all keys for a group (used by Next.js pages). Cached in Redis. */
  @Get()
  getGroup(@Query('group') group: string, @Query('locale') locale?: string) {
    return this.siteContent.getGroup(group || 'landing', locale || 'en');
  }

  /** Public: get a single key value. */
  @Get('key/:key')
  getKey(@Param('key') key: string, @Query('locale') locale?: string) {
    return this.siteContent.getKey(key, locale || 'en');
  }

  /** Super Admin: list all content rows (for editor UI). */
  @Get('all')
  @UseGuards(JwtUserGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  listAll(@Query('group') group?: string, @Query('locale') locale?: string) {
    return this.siteContent.listAll(group, locale);
  }

  /** Super Admin: update a single content key. */
  @Put('key/:key')
  @UseGuards(JwtUserGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  upsert(
    @Param('key') key: string,
    @Query('locale') locale: string = 'en',
    @Body() dto: UpsertSiteContentDto,
    @AuthUserDecorator() user: AuthUser,
  ) {
    return this.siteContent.upsert(key, locale, dto.value, user.userId);
  }

  /** Super Admin: bulk update multiple keys at once. */
  @Post('bulk')
  @UseGuards(JwtUserGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  bulk(@Body() dto: BulkUpsertSiteContentDto, @AuthUserDecorator() user: AuthUser) {
    return this.siteContent.bulkUpsert(dto.items, user.userId);
  }
}
