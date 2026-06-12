import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/auth/user-role.enum';
import { SubscriptionPlan } from '@prisma/client';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async listBusinesses() {
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, slug: true, isActive: true, createdAt: true, categoryId: true },
    });
  }

  async createBusinessWithAdmin(args: {
    name: string;
    categoryId?: string;
    phone?: string;
    adminUsername: string;
    adminPassword: string;
  }) {
    const base = slugify(args.name);
    if (!base) throw new BadRequestException('Invalid business name');

    const existingUser = await this.prisma.user.findUnique({
      where: { username: args.adminUsername },
      select: { id: true },
    });
    if (existingUser) throw new BadRequestException('Admin username already exists');

    const existingCount = await this.prisma.business.count({
      where: { slug: { startsWith: base } },
    });
    const slug = existingCount === 0 ? base : `${base}-${existingCount + 1}`;

    const category = args.categoryId
      ? await this.prisma.businessCategory.findUnique({ where: { id: args.categoryId } })
      : null;

    const business = await this.prisma.business.create({
      data: {
        name: args.name,
        slug,
        phone: args.phone,
        categoryId: args.categoryId,
      },
      select: { id: true, name: true, slug: true, categoryId: true },
    });

    const passwordHash = await bcrypt.hash(args.adminPassword, 10);
    const adminUser = await this.prisma.user.create({
      data: {
        username: args.adminUsername,
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: UserRole.BUSINESS_ADMIN,
        businessId: business.id,
      },
      select: { id: true, username: true, role: true, businessId: true },
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

    return {
      ok: true,
      business,
      adminUser,
      templateServicesCreated: services.length,
    };
  }

  async listBusinessFeatures(businessId: string) {
    const existing = await this.prisma.businessFeature.findMany({
      where: { businessId },
      select: { key: true, enabled: true, updatedAt: true },
      orderBy: { key: 'asc' },
    });
    return existing;
  }

  async setBusinessFeature(args: { businessId: string; key: string; enabled: boolean }) {
    return this.prisma.businessFeature.upsert({
      where: { businessId_key: { businessId: args.businessId, key: args.key } },
      create: { businessId: args.businessId, key: args.key, enabled: args.enabled },
      update: { enabled: args.enabled },
      select: { key: true, enabled: true },
    });
  }

  async stats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, active, newThisWeek, newThisMonth, categories, waConnected, withBookings] =
      await Promise.all([
        this.prisma.business.count(),
        this.prisma.business.count({ where: { isActive: true } }),
        this.prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.business.count({ where: { createdAt: { gte: monthAgo } } }),
        this.prisma.businessCategory.findMany({
          select: { key: true, name: true, _count: { select: { businesses: true } } },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.whatsAppSession.count({ where: { status: 'CONNECTED' } }),
        this.prisma.business.count({
          where: {
            appointments: {
              some: { createdAt: { gte: monthAgo } },
            },
          },
        }),
      ]);

    return {
      total,
      active,
      inactive: total - active,
      newThisWeek,
      newThisMonth,
      waConnected,
      withBookings,
      byCategory: categories.map((c) => ({ key: c.key, name: c.name, count: c._count.businesses })),
    };
  }

  async listActivationCodes() {
    return this.prisma.activationCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        code: true,
        plan: true,
        validityDays: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        note: true,
        createdAt: true,
      },
    });
  }

  async createActivationCode(args: {
    code: string;
    plan: SubscriptionPlan;
    validityDays: number;
    maxUses?: number;
    expiresAt?: Date;
    note?: string;
  }) {
    const code = args.code.trim().toUpperCase();
    if (code.length < 3) throw new BadRequestException('Code too short');
    return this.prisma.activationCode.create({
      data: {
        code,
        plan: args.plan,
        validityDays: args.validityDays,
        maxUses: args.maxUses ?? 1,
        expiresAt: args.expiresAt,
        note: args.note,
        isActive: true,
      },
    });
  }

  async setActivationCodeActive(id: string, isActive: boolean) {
    return this.prisma.activationCode.update({
      where: { id },
      data: { isActive },
      select: { id: true, code: true, isActive: true },
    });
  }

  async setBusinessPlan(businessId: string, plan: SubscriptionPlan, validityDays?: number) {
    const expiresAt =
      plan === SubscriptionPlan.FREE
        ? null
        : new Date(Date.now() + (validityDays ?? 30) * 24 * 60 * 60 * 1000);
    return this.prisma.business.update({
      where: { id: businessId },
      data: { plan, planExpiresAt: expiresAt },
      select: { id: true, name: true, plan: true, planExpiresAt: true },
    });
  }
}

