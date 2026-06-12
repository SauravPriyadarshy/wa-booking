import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/auth/user-role.enum';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

function referralCodeFromSlug(slug: string) {
  return slug.replace(/-/g, '').slice(0, 8).toUpperCase() || `REF${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  private async redeemActivationCode(businessId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const activation = await this.prisma.activationCode.findUnique({ where: { code } });
    if (!activation || !activation.isActive) throw new BadRequestException('Invalid activation code');
    if (activation.expiresAt && activation.expiresAt < new Date()) {
      throw new BadRequestException('Activation code expired');
    }
    if (activation.usedCount >= activation.maxUses) {
      throw new BadRequestException('Activation code fully used');
    }

    const existing = await this.prisma.activationRedemption.findUnique({
      where: { codeId_businessId: { codeId: activation.id, businessId } },
    });
    if (existing) throw new BadRequestException('Code already used for this business');

    const planExpiresAt = new Date(Date.now() + activation.validityDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.business.update({
        where: { id: businessId },
        data: { plan: activation.plan, planExpiresAt },
      }),
      this.prisma.activationRedemption.create({
        data: { codeId: activation.id, businessId },
      }),
      this.prisma.activationCode.update({
        where: { id: activation.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    return { plan: activation.plan, planExpiresAt };
  }

  async createForUser(
    userId: string,
    args: {
      name: string;
      categoryId?: string;
      subcategoryId?: string;
      customSpecialization?: string;
      phone?: string;
      referralCode?: string;
      activationCode?: string;
    },
  ) {
    const base = slugify(args.name);
    if (!base) throw new BadRequestException('Invalid business name');

    const existingCount = await this.prisma.business.count({
      where: { slug: { startsWith: base } },
    });
    const slug = existingCount === 0 ? base : `${base}-${existingCount + 1}`;

    const category = args.categoryId
      ? await this.prisma.businessCategory.findUnique({ where: { id: args.categoryId } })
      : null;

    let referredByBusinessId: string | undefined;
    if (args.referralCode?.trim()) {
      const referrer = await this.prisma.business.findUnique({
        where: { referralCode: args.referralCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (referrer) referredByBusinessId = referrer.id;
    }

    const business = await this.prisma.business.create({
      data: {
        name: args.name,
        slug,
        phone: args.phone,
        categoryId: args.categoryId,
        subcategoryId: args.subcategoryId,
        customSpecialization: args.customSpecialization?.trim() || undefined,
        referralCode: referralCodeFromSlug(slug),
        referredByBusinessId,
        plan: SubscriptionPlan.FREE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        subcategoryId: true,
        plan: true,
        referralCode: true,
      },
    });

    if (args.activationCode?.trim()) {
      await this.redeemActivationCode(business.id, args.activationCode);
    }

    // attach user to business (becomes BUSINESS_ADMIN if not superadmin)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        businessId: business.id,
        role: user.role === UserRole.SUPER_ADMIN ? user.role : UserRole.BUSINESS_ADMIN,
      },
    });

    // apply template services
    const tpl = (category?.templateJson as any) ?? null;
    const services: any[] = Array.isArray(tpl?.services) ? tpl.services : [];
    if (services.length > 0) {
      await this.prisma.service.createMany({
        data: services.map((s) => ({
          businessId: business.id,
          name: String(s.name),
          durationMin: Number(s.durationMin ?? 15),
          bufferBeforeMin: Number(s.bufferBeforeMin ?? 0),
          bufferAfterMin: Number(s.bufferAfterMin ?? 0),
          isActive: true,
        })),
      });
    }

    return { ok: true, business, templateServicesCreated: services.length };
  }

  async redeemCodeForUser(userId: string, rawCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });
    if (!user?.businessId) throw new BadRequestException('No business on this account');
    return this.redeemActivationCode(user.businessId, rawCode);
  }

  async getMyBusiness(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        timezone: true,
        categoryId: true,
        subcategoryId: true,
        customSpecialization: true,
        plan: true,
        planExpiresAt: true,
        referralCode: true,
      },
    });
  }

  async getBusinessForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });
    if (!user?.businessId) return null;
    return this.getMyBusiness(user.businessId);
  }

  async getBySlug(slug: string) {
    return this.prisma.business.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        services: {
          where: { isActive: true },
          select: { id: true, name: true, durationMin: true, priceCents: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  /** New slug only when an admin explicitly requests it; old public URL stops working. */
  async regenerateBookingSlug(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        businessId: true,
        business: { select: { id: true, name: true } },
      },
    });
    if (!user?.businessId || !user.business) {
      throw new BadRequestException('No business on this account');
    }
    if (user.role === UserRole.STAFF) {
      throw new ForbiddenException(
        'Only business admins can create a new booking link',
      );
    }

    const base = slugify(user.business.name) || 'book';
    let newSlug: string | null = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 10);
      const candidate = `${base}-${suffix}`;
      const taken = await this.prisma.business.findFirst({
        where: { slug: candidate, NOT: { id: user.business.id } },
      });
      if (!taken) {
        newSlug = candidate;
        break;
      }
    }
    if (!newSlug) {
      throw new BadRequestException(
        'Could not generate a unique link. Try again.',
      );
    }

    await this.prisma.business.update({
      where: { id: user.business.id },
      data: { slug: newSlug },
    });

    return { ok: true as const, slug: newSlug };
  }
}

