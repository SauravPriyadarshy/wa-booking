import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../common/auth/user-role.enum';
import type { AuthUser } from '../common/auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

type JwtPayload = {
  userId: string;
  role: UserRole;
  businessId?: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    let businessId = payload.businessId ?? null;

    // If businessId is missing in JWT (stale token), try to fetch from DB
    if (!businessId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { businessId: true },
      });
      if (user?.businessId) {
        businessId = user.businessId;
      }
    }

    return {
      userId: payload.userId,
      role: payload.role,
      businessId,
    };
  }
}

