import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/auth/user-role.enum';
import crypto from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async bootstrapSuperAdmin(args: {
    username?: string;
    phone?: string;
    email?: string;
    password: string;
  }) {
    const hasAnyId = Boolean(args.username || args.phone || args.email);
    if (!hasAnyId) throw new BadRequestException('Username, phone, or email required');

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          args.username ? { username: args.username } : undefined,
          args.phone ? { phone: args.phone } : undefined,
          args.email ? { email: args.email } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (existing) return { ok: true, userId: existing.id };

    const passwordHash = await bcrypt.hash(args.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: args.username,
        phone: args.phone,
        email: args.email,
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: UserRole.SUPER_ADMIN,
      },
      select: { id: true },
    });

    return { ok: true, userId: user.id };
  }

  async loginWithPassword(args: {
    username?: string;
    phone?: string;
    email?: string;
    password: string;
  }) {
    const hasAnyId = Boolean(args.username || args.phone || args.email);
    if (!hasAnyId) throw new BadRequestException('Username, phone, or email required');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          args.username ? { username: args.username } : undefined,
          args.phone ? { phone: args.phone } : undefined,
          args.email ? { email: args.email } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(args.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwt.signAsync({
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? null,
    });

    const refreshToken = await this.issueRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        businessId: user.businessId,
        username: user.username,
        phone: user.phone,
        email: user.email,
        name: user.name,
      },
    };
  }

  // Dev-only OTP stub. In production, integrate SMS provider.
  async requestOtp(phone: string) {
    await this.prisma.user.upsert({
      where: { phone },
      create: { phone, role: UserRole.BUSINESS_ADMIN },
      update: {},
    });
    return { ok: true, devCode: '1234' };
  }

  async verifyOtp(phone: string, code: string) {
    if (code !== '1234') throw new UnauthorizedException('Invalid code');
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid phone');

    const token = await this.jwt.signAsync({
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? null,
    });

    const refreshToken = await this.issueRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        businessId: user.businessId,
        username: user.username,
        phone: user.phone,
        email: user.email,
        name: user.name,
      },
    };
  }

  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid user');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid current password');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    });
    return { ok: true };
  }

  async adminSetPassword(targetUserId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    });
    return { ok: true };
  }

  async ensureDefaultAdmin() {
    const username = 'admin';
    const password = 'Test@123';

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) return { ok: true, created: false, userId: existing.id };

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: UserRole.SUPER_ADMIN,
      },
      select: { id: true },
    });
    return { ok: true, created: true, userId: user.id, username };
  }

  private async issueRefreshToken(userId: string) {
    const raw = crypto.randomUUID() + crypto.randomUUID();
    const tokenPrefix = raw.slice(0, 8); // indexed prefix for O(1) lookup
    const tokenHash = await bcrypt.hash(raw, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, tokenPrefix, expiresAt },
      select: { id: true },
    });
    return raw;
  }

  /**
   * O(1) refresh: filter by indexed tokenPrefix (8 chars) → bcrypt verify against
   * at most a handful of rows instead of scanning all active tokens.
   */
  async refresh(raw: string) {
    const prefix = raw.slice(0, 8);
    const candidates = await this.prisma.refreshToken.findMany({
      where: { tokenPrefix: prefix, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true, tokenHash: true },
    });

    for (const t of candidates) {
      const ok = await bcrypt.compare(raw, t.tokenHash);
      if (!ok) continue;

      await this.prisma.refreshToken.update({
        where: { id: t.id },
        data: { revokedAt: new Date() },
      });

      const user = await this.prisma.user.findUnique({ where: { id: t.userId } });
      if (!user) throw new UnauthorizedException('Invalid token');

      const token = await this.jwt.signAsync({
        userId: user.id,
        role: user.role,
        businessId: user.businessId ?? null,
      });
      const refreshToken = await this.issueRefreshToken(user.id);

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          role: user.role,
          businessId: user.businessId,
          username: user.username,
        },
      };
    }

    throw new UnauthorizedException('Invalid refresh token');
  }
}

