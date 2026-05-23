import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
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
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('bootstrap-superadmin')
  bootstrap(@Body() dto: BootstrapSuperAdminDto) {
    return this.auth.bootstrapSuperAdmin(dto);
  }

  @Post('ensure-default-admin')
  ensureDefaultAdmin() {
    if (process.env.NODE_ENV === 'production') {
      // hard-disable in prod
      return { ok: false, message: 'Disabled in production' };
    }
    return this.auth.ensureDefaultAdmin();
  }

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

  @Post('otp/request')
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Res({ passthrough: true }) res: Response, @Body() dto: OtpVerifyDto) {
    const data = await this.auth.verifyOtp(dto.phone, dto.code);
    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });
    return { ...data, refreshToken: undefined };
  }

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

