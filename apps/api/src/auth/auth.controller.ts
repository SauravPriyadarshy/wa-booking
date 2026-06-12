import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  AdminSetPasswordDto,
  BootstrapSuperAdminDto,
  ChangePasswordDto,
  LoginDto,
  OtpRequestDto,
  OtpVerifyDto,
  RefreshDto,
} from './auth.dto';
import { JwtUserGuard } from '../common/auth/jwt-user.guard';
import { Roles } from '../common/auth/roles.decorator';
import { UserRole } from '../common/auth/user-role.enum';
import { AuthUserDecorator } from '../common/auth/auth-user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { RolesGuard } from '../common/auth/roles.guard';
import { assertNotProductionEndpoint } from '../common/security-config';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('bootstrap-superadmin')
  bootstrap(@Body() dto: BootstrapSuperAdminDto) {
    const blocked = assertNotProductionEndpoint('bootstrap-superadmin');
    if (blocked) return blocked;
    return this.auth.bootstrapSuperAdmin(dto);
  }

  @Post('ensure-default-admin')
  ensureDefaultAdmin() {
    const blocked = assertNotProductionEndpoint('ensure-default-admin');
    if (blocked) return blocked;
    return this.auth.ensureDefaultAdmin();
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    const data = await this.auth.loginWithPassword(dto);
    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });
    return { ...data, refreshToken: undefined };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('otp/request')
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.auth.requestOtp(dto.phone, dto.channel ?? 'whatsapp', dto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('otp/verify')
  async verifyOtp(@Res({ passthrough: true }) res: Response, @Body() dto: OtpVerifyDto) {
    const data = await this.auth.verifyOtp(dto.phone, dto.code, dto.password);
    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });
    return { ...data, refreshToken: undefined };
  }

  @SkipThrottle()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RefreshDto,
  ) {
    const fromCookie = (req as any).cookies?.refresh_token as string | undefined;
    const raw = dto.refreshToken ?? fromCookie;
    if (!raw) return { ok: false, message: 'Missing refresh token' };

    const data = await this.auth.refresh(raw);
    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });
    return { ...data, refreshToken: undefined };
  }

  @Post('password/change')
  @UseGuards(JwtUserGuard)
  changePassword(@AuthUserDecorator() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changeOwnPassword(user.userId, dto.currentPassword, dto.newPassword);
  }

  @Post('password/admin-set')
  @UseGuards(JwtUserGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  adminSetPassword(@Body() dto: AdminSetPasswordDto) {
    return this.auth.adminSetPassword(dto.userId, dto.newPassword);
  }
}

